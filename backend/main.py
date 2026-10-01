import sqlite3
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Todo API")

# Allow the React app (on any web address) to talk to this server.
# Fine for a demo; a real app would list only its own address here.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def db():
    conn = sqlite3.connect("todos.db")  # a file created next to main.py
    conn.row_factory = sqlite3.Row
    return conn


with db() as conn:
    conn.execute(
        """CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            done INTEGER NOT NULL DEFAULT 0,
            category TEXT NOT NULL DEFAULT '',
            due_date TEXT,
            position INTEGER NOT NULL
        )"""
    )


class TodoIn(BaseModel):
    title: str
    category: str = ""
    due_date: Optional[str] = None


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    done: Optional[bool] = None
    category: Optional[str] = None
    due_date: Optional[str] = None


class Order(BaseModel):
    ids: list[int]


def to_dict(row):
    d = dict(row)
    d["done"] = bool(d["done"])
    return d


@app.get("/todos")
def list_todos():
    with db() as conn:
        return [to_dict(r) for r in conn.execute("SELECT * FROM todos ORDER BY position")]


@app.post("/todos", status_code=201)
def add_todo(todo: TodoIn):
    with db() as conn:
        pos = conn.execute("SELECT COALESCE(MAX(position), 0) + 1 FROM todos").fetchone()[0]
        cur = conn.execute(
            "INSERT INTO todos (title, category, due_date, position) VALUES (?, ?, ?, ?)",
            (todo.title.strip(), todo.category.strip(), todo.due_date, pos),
        )
        return to_dict(conn.execute("SELECT * FROM todos WHERE id = ?", (cur.lastrowid,)).fetchone())


# This must come before /todos/{todo_id}, otherwise "reorder" is read as an id
@app.put("/todos/reorder")
def reorder(order: Order):
    with db() as conn:
        for position, todo_id in enumerate(order.ids):
            conn.execute("UPDATE todos SET position = ? WHERE id = ?", (position, todo_id))
    return {"ok": True}


@app.patch("/todos/{todo_id}")
def update_todo(todo_id: int, changes: TodoUpdate):
    data = changes.model_dump(exclude_unset=True)  # only fields that were sent
    with db() as conn:
        if data:
            fields = ", ".join(f"{key} = ?" for key in data)
            conn.execute(f"UPDATE todos SET {fields} WHERE id = ?", (*data.values(), todo_id))
        row = conn.execute("SELECT * FROM todos WHERE id = ?", (todo_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return to_dict(row)


@app.delete("/todos/{todo_id}")
def delete_todo(todo_id: int):
    with db() as conn:
        conn.execute("DELETE FROM todos WHERE id = ?", (todo_id,))
    return {"ok": True}
