import { useEffect, useState } from "react";

// Uses the live backend address when deployed, and localhost on your own computer
const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Small helper for talking to the backend
const api = (path, method = "GET", body) =>
  fetch(API + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body && JSON.stringify(body),
  }).then((r) => r.json());

const today = () => new Date().toISOString().slice(0, 10);
const empty = { title: "", category: "", due_date: "" };

export default function App() {
  const [todos, setTodos] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null); // the todo being edited
  const [dragId, setDragId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/todos")
      .then(setTodos)
      .catch(() => setError("Can't reach the backend. Check that it is running on port 8000."));
  }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const todo = await api("/todos", "POST", { ...form, due_date: form.due_date || null });
    setTodos([...todos, todo]);
    setForm(empty);
  };

  const patch = async (id, changes) => {
    const todo = await api(`/todos/${id}`, "PATCH", changes);
    setTodos((list) => list.map((t) => (t.id === id ? todo : t)));
  };

  const remove = async (id) => {
    await api(`/todos/${id}`, "DELETE");
    setTodos((list) => list.filter((t) => t.id !== id));
  };

  const saveEdit = async () => {
    const { id, title, category, due_date } = editing;
    if (title.trim()) await patch(id, { title, category, due_date: due_date || null });
    setEditing(null);
  };

  // While dragging, move the dragged item over the one under the pointer
  const dragOver = (e, overId) => {
    e.preventDefault();
    if (overId === dragId) return;
    setTodos((list) => {
      const copy = [...list];
      const from = copy.findIndex((t) => t.id === dragId);
      const to = copy.findIndex((t) => t.id === overId);
      copy.splice(to, 0, copy.splice(from, 1)[0]);
      return copy;
    });
  };

  // When dropped, save the new order
  const drop = () => {
    setDragId(null);
    api("/todos/reorder", "PUT", { ids: todos.map((t) => t.id) });
  };

  const left = todos.filter((t) => !t.done).length;

  return (
    <main>
      <h1>My todos</h1>
      <p className="sub">{todos.length ? `${left} of ${todos.length} left to do` : "Nothing here yet."}</p>

      <form className="add" onSubmit={add}>
        <input
          className="grow"
          placeholder="What needs doing?"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <input
          type="date"
          value={form.due_date}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
        />
        <button className="primary">Add todo</button>
      </form>

      {error && <p className="error">{error}</p>}

      <ul>
        {todos.map((t) => (
          <li
            key={t.id}
            className={`${t.done ? "done" : ""} ${dragId === t.id ? "dragging" : ""}`}
            draggable={editing?.id !== t.id}
            onDragStart={() => setDragId(t.id)}
            onDragOver={(e) => dragOver(e, t.id)}
            onDragEnd={drop}
          >
            <span className="handle" title="Drag to reorder">⋮⋮</span>
            <input type="checkbox" checked={t.done} onChange={() => patch(t.id, { done: !t.done })} />

            {editing?.id === t.id ? (
              <div className="edit">
                <input
                  className="grow"
                  autoFocus
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
                <input
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                />
                <input
                  type="date"
                  value={editing.due_date || ""}
                  onChange={(e) => setEditing({ ...editing, due_date: e.target.value })}
                />
                <button className="primary" onClick={saveEdit}>Save</button>
                <button onClick={() => setEditing(null)}>Cancel</button>
              </div>
            ) : (
              <>
                <div className="text">
                  <span className="title">{t.title}</span>
                  <span className="meta">
                    {t.category && <span className="tag">{t.category}</span>}
                    {t.due_date && (
                      <span className={!t.done && t.due_date < today() ? "late" : ""}>
                        Due {t.due_date}
                        {!t.done && t.due_date < today() ? " (overdue)" : ""}
                      </span>
                    )}
                  </span>
                </div>
                <button onClick={() => setEditing({ ...t })}>Edit</button>
                <button className="danger" onClick={() => remove(t.id)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
