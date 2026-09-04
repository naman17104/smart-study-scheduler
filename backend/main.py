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

DB_PATH = "scheduler.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/")
def home():
    return {"status": "Backend Running"}

@app.get("/api/schedule")
def get_schedule():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, subject, time, duration FROM tasks ORDER BY id DESC")
    rows = cur.fetchall()
    conn.close()
    tasks = [dict(r) for r in rows]
    return {"status": "success", "tasks": tasks}

@app.post("/api/add_task")
def add_task(task: dict):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO tasks (subject, time, duration) VALUES (?, ?, ?)",
                (task.get("subject"), task.get("time"), task.get("duration")))
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return {"id": new_id, "status": "added"}

@app.delete("/api/delete_task/{task_id}")
def delete_task(task_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "id": task_id}