# Todo app (FastAPI + React)

## 1. Install the two tools (one time only)
- Python 3.10+: https://www.python.org/downloads/  (on Windows, tick "Add Python to PATH")
- Node.js (LTS): https://nodejs.org/
Check they work by running `python --version` (or `python3 --version`) and `node --version` in a terminal.

## 2. Start the backend (terminal 1)
    cd backend
    python -m venv venv
    # Windows:  venv\Scripts\activate      Mac/Linux:  source venv/bin/activate
    pip install -r requirements.txt
    uvicorn main:app --reload
The API runs at http://localhost:8000 (auto docs at http://localhost:8000/docs).

## 3. Start the frontend (terminal 2)
    cd frontend
    npm install
    npm run dev
Open http://localhost:5173 in your browser.

Your todos are saved in backend/todos.db. Delete that file to start fresh.
