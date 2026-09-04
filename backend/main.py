from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "scheduler.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject TEXT,
            time TEXT,
            duration TEXT,
            date TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

@app.get("/api/tasks")
def get_tasks():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, subject, time, duration, date FROM tasks")
    rows = cur.fetchall()
    conn.close()
    tasks = [{"id": r[0], "subject": r[1], "time": r[2], "duration": r[3], "date": r[4]} for r in rows]
    return tasks

@app.post("/api/add_task")
def add_task(task: dict):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO tasks (subject, time, duration, date) VALUES (?,?,?,?)", (task.get("subject"), task.get("time"), task.get("duration"), task.get("date")))
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return {"id": new_id, "status": "added"}

@app.delete("/api/delete_task/{task_id}")
def delete_task(task_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM tasks WHERE id =?", (task_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "id": task_id}

@app.get("/")
def root():
    return {"message": "Backend is running!"}