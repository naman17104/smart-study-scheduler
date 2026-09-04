"use client"
import { useState, useEffect } from "react"

export default function FocusPage() {
  const [task, setTask] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    const data = localStorage.getItem("focus_task")
    if (data) {
      const t = JSON.parse(data)
      setTask(t)
      // FIX: hours ko sahi se parse karna
      let totalSeconds = 25 * 60
      if (t.duration) {
        const num = parseInt(t.duration)
        if (t.duration.includes("hour")) totalSeconds = num * 60 * 60
        else totalSeconds = num * 60
      }
      setTimeLeft(totalSeconds)
    }
  }, [])

  useEffect(() => {
    if (timeLeft <= 0) return
    const i = setInterval(() => setTimeLeft(s => s - 1), 1000)
    return () => clearInterval(i)
  }, [timeLeft])

  if (!task) return <div style={{background:"#FFF8E7", height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:"black"}}>No task selected</div>

  const h = Math.floor(timeLeft / 3600)
  const m = Math.floor((timeLeft % 3600) / 60)
  const s = timeLeft % 60

  return (
    <div style={{backgroundColor:"#FFF8E7", color:"#2B2B2B", height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"Georgia, serif"}}>
      <p style={{opacity:0.5, letterSpacing:"4px", fontSize:"14px"}}>FOCUS MODE</p>
      <h1 style={{fontSize:"60px", fontWeight:"bold", margin:"20px", textAlign:"center"}}>{task.subject}</h1>
      <p style={{fontSize:"18px", opacity:0.6, marginBottom:"40px"}}>{task.time} • {task.duration}</p>
      <div style={{fontSize:"120px", fontWeight:200, lineHeight:"1"}}>
        {h > 0? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
      </div>
      <p style={{marginTop:"50px", opacity:0.4}}>Stay focused. You've got this.</p>
    </div>
  )
}