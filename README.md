# Smart Study Scheduler - 3D 📅✨

![TypeScript](https://img.shields.io/badge/TypeScript-88.9%25-blue)
![Python](https://img.shields.io/badge/Python-7%25-yellow)
![React Three Fiber](https://img.shields.io/badge/3D-React%20Three%20Fiber-purple)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black)

## 📸 Dashboard Preview
![Dashboard Preview](./image.png)

> My 3D Study Scheduler with calendar - Plan your studies smartly, visually, and efficiently.

A modern, 3D-enabled study scheduler with calendar integration to help students organize subjects, set deadlines, and track progress visually. No more messy to-do lists. Built to solve a real student problem: managing multiple subjects, deadlines, and focus time in one visual place.

### 🚀 Live Demo
**👉 https://smart-study-scheduler-rho.vercel.app**

---

### 📖 About The Project
Most to-do apps are flat and boring. I wanted to make studying feel visual and engaging. Smart Study Scheduler is a full-stack productivity tool that combines a traditional calendar with a modern 3D interface. You can plan subjects, set priorities, start a Pomodoro focus timer, and see your daily/weekly/monthly progress at a glance.

I built this as a monorepo with a TypeScript + React frontend for the 3D UI and a lightweight Python backend for data and date handling.

### ✨ Key Features
- 📅 **Calendar Integration** - Visual monthly/weekly view for all study tasks and deadlines. Drag & drop support.
- 🎨 **3D Interactive UI** - Immersive 3D design built with Three.js / React Three Fiber & Drei.
- ✅ **Smart Task Management** - Full CRUD - Add, edit, delete, and mark tasks as complete with priority.
- ⏰ **Focus Timer** - In-built Pomodoro Timer (25 min focus) to track deep work sessions.
- 📊 **Progress Tracking** - Track your daily, weekly, and monthly study progress with visual charts.
- 📱 **Fully Responsive** - Works perfectly on mobile, tablet, and desktop.

### 🏗️ How It Works
User -> React Frontend (3D View + Calendar) -> Python REST API -> Data Store -> Progress Update

1. User creates a task with subject, date, time & priority.
2. Task is saved via Python API.
3. It renders instantly on both the 3D board and the calendar.
4. User can start focus timer, and on completion, progress is updated.

### 🛠️ Tech Stack
- **Frontend:** TypeScript (88.9%), React, React Three Fiber, Drei, Tailwind CSS, Framer Motion
- **Backend:** Python (7%) - REST API & Date Field Handling
- **Deployment:** Vercel + Serverless Functions
- **Architecture:** Monorepo - frontend/ + backend/

### 📂 Project Structure
    smart-study-scheduler/
    ├── frontend/          # React + TypeScript + Three.js
    │   ├── components/    # 3D Cards, Calendar, Timer
    │   ├── hooks/
    │   └── pages/
    ├── backend/           # Python API
    ├── image.png          # Dashboard Preview
    └── README.md

### 🚀 Quick Start Locally
Clone: git clone https://github.com/naman1734/smart-study-scheduler.git
Frontend: cd frontend && npm install && npm run dev
Backend: cd backend && pip install -r requirements.txt && python app.py

### 🔮 Future Scope
- AI-based auto study plan generator
- Google Calendar sync
- Collaboration - share study plans with friends

---
**Made with ❤️ by Nihar Rohilla | 2026**
