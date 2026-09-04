"use client";
import { useState, useEffect, useRef } from "react";
type Task = { id:number; subject:string; time:string; duration:string; status: 'pending' | 'completed' | 'missed', date: string, reason?: string };

export default function SmartScheduler() {
  const API_URL = "https://smart-study-scheduler-backend-qtpe.onrender.com";
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sub, setSub] = useState("");
  const [timeHour, setTimeHour] = useState("10");
  const [timeMin, setTimeMin] = useState("00");
  const [ampm, setAmPm] = useState("AM");
  const [dur, setDur] = useState("2 hours");
  const [notif, setNotif] = useState<string|null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const selectedDateStr = selectedDate.toDateString();
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [initialTime, setInitialTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [currentFocusTask, setCurrentFocusTask] = useState<Task | null>(null);
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [editMins, setEditMins] = useState("25");
  const [showCelebration, setShowCelebration] = useState(false);
  const [quote, setQuote] = useState("");
  const quotes = ["🔥 Booom! Ek aur jeet!","💪 Consistency is power.","🚀 Small wins = Big placements.","🎯 Focus ka boss! FAANG pakka hai!","⚡ Discipline > Motivation."];

  const startFocusMode = (task: Task) => {
    localStorage.setItem("focus_task", JSON.stringify(task))
    window.open("/focus", "_blank")
  }

  useEffect(()=>{
    const saved = localStorage.getItem("smart_tasks");
    if(saved){ try{ setTasks(JSON.parse(saved)); }catch(e){} }
    fetch(`${API_URL}/api/tasks`).then(r=>r.json()).then(d=>{
      if(Array.isArray(d) && d.length>0){
        const mapped = d.map((t:any)=>({...t, status: t.status || 'pending', date: t.date || new Date().toDateString()}));
        setTasks(mapped);
      }
    }).catch(()=>{});
  },[]);

  useEffect(()=>{ localStorage.setItem("smart_tasks", JSON.stringify(tasks)); },[tasks]);

  useEffect(() => {
    let interval: any;
    if (isRunning && pomodoroTime > 0) {
      interval = setInterval(() => setPomodoroTime(t => t - 1), 1000);
    } else if (isRunning && pomodoroTime === 0) {
      setIsBreak(!isBreak);
      setPomodoroTime(isBreak? initialTime : 5 * 60);
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, pomodoroTime, isBreak]);

  const showNotify = (msg:string) => { setNotif(msg); setTimeout(()=>setNotif(null), 4000); };
  const addTask = async () => {
    if(!sub) return;
    const finalTime = `${timeHour}:${timeMin} ${ampm}`;
    const newTask: Task = {id: Date.now(), subject:sub, time: finalTime, duration:dur, status:'pending', date: selectedDateStr};
    setTasks([...tasks, newTask]); setSub(""); showNotify(`Added: ${sub}`);
  };
  const startFocusingTask = (task: Task) => { setCurrentFocusTask(task); setIsBreak(false); setIsRunning(true); setPomodoroTime(initialTime); };
  const updateStatus = (id:number, status:'completed'|'missed') => { setTasks(tasks.map(t=> t.id===id? {...t, status} : t)); };
  const deleteTask = async (id:number) => { setTasks(tasks.filter(t=>t.id!==id)); };
  const changeMonth = (delta: number) => setViewDate(prev => { const d = new Date(prev); d.setMonth(prev.getMonth()+delta); return d; });
  const changeYear = (delta: number) => setViewDate(prev => { const d = new Date(prev); d.setFullYear(prev.getFullYear()+delta); return d; });
  const filteredTasks = tasks.filter(t => t.date === selectedDateStr);
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  return (
    <div className="bg-[#050711] text-white min-h-screen">
      <nav className="flex justify-between items-center p-4 border-b border-white/10 sticky top-0 bg-[#080A14]/80 backdrop-blur-md z-10">
        <h1 className="text-xl font-black tracking-wider hover:scale-105 transition-transform cursor-default">SMART STUDY SCHEDULER <span className="bg-[#6C5CE7] text-xs px-2 py-1 rounded ml-2">PRO</span></h1>
        <div className="flex gap-3">
          <button onClick={()=>{const now=new Date(); setSelectedDate(now); setViewDate(now);}} className="px-5 py-2 bg-white/10 rounded-full hover:bg-white hover:text-black hover:scale-110 hover:shadow-[0_0_20px_white] transition-all cursor-pointer">Today</button>
          <button onClick={()=>{setIsRunning(true); setIsBreak(false);}} className="px-5 py-2 bg-gradient-to-r from-[#6C5CE7] to-[#A855F7] rounded-full font-bold hover:scale-110 hover:shadow-[0_0_25px_#6C5CE7] transition-all cursor-pointer">Start Focus</button>
        </div>
      </nav>
      {notif && <div className="fixed top-20 right-5 bg-[#6C5CE7] px-6 py-3 rounded-xl shadow-[0_0_30px_#6C5CE7] z-50">{notif}</div>}
      <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/beep_short.ogg" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-[1600px] mx-auto">
        {/* LEFT - PURPLE GLOW */}
        <div className="lg:col-span-3 bg-[#121424] p-5 rounded-2xl border border-white/5 h-fit transition-all duration-500 hover:border-[#6C5CE7]/50 hover:shadow-[0_20px_60px_-15px_rgba(108,92,231,0.6)] hover:-translate-y-2 hover:rotate-[0.5deg] hover:scale-[1.02] group">
          <h2 className="font-bold mb-2 group-hover:text-[#6C5CE7] transition-colors">+ Add for</h2>
          <p className="text-xs text-[#6C5CE7] font-bold mb-3">{selectedDate.toLocaleDateString('en-IN', {weekday:'short', day:'numeric', month:'short', year:'numeric'})}</p>
          <input value={sub} onChange={e=>setSub(e.target.value)} placeholder="Subject e.g. Python" className="w-full bg-black/50 p-3 rounded-lg mb-3 border border-white/10 outline-none focus:border-[#6C5CE7] focus:scale-[1.02] transition-all" />
          <div className="flex gap-2 mb-3">
            <div className="flex gap-1 w-[60%] bg-black/50 p-2 rounded-lg border border-white/10 items-center hover:border-[#6C5CE7]/30 transition-all">
              <select value={timeHour} onChange={e=>setTimeHour(e.target.value)} className="bg-transparent outline-none w-1/3 text-center cursor-pointer">{Array.from({length:12},(_,i)=>{const h=i+1; const val=String(h).padStart(2,'0'); return <option key={h} value={val} className="text-black">{val}</option>})}</select>
              <span>:</span>
              <select value={timeMin} onChange={e=>setTimeMin(e.target.value)} className="bg-transparent outline-none w-1/3 text-center cursor-pointer">{["00","15","30","45"].map(m=><option key={m} value={m} className="text-black">{m}</option>)}</select>
              <select value={ampm} onChange={e=>setAmPm(e.target.value)} className="bg-[#6C5CE7] rounded-md px-2 py-1 font-bold ml-1 cursor-pointer hover:scale-110 transition-all"><option value="AM" className="text-black">AM</option><option value="PM" className="text-black">PM</option></select>
            </div>
            <input value={dur} onChange={e=>setDur(e.target.value)} className="w-[40%] bg-black/50 p-3 rounded-lg border border-white/10" />
          </div>
          <button onClick={addTask} className="w-full py-3 bg-[#6C5CE7] rounded-xl font-bold hover:scale-[1.05] hover:shadow-[0_0_30px_#6C5CE7] hover:brightness-125 active:scale-95 transition-all cursor-pointer">Add Task + Reminder</button>
        </div>

        {/* MIDDLE - GREEN GLOW */}
        <div className="lg:col-span-6 bg-[#121424] p-5 rounded-2xl border border-white/5 min-h-[500px] transition-all duration-500 hover:border-emerald-500/50 hover:shadow-[0_20px_60px_-15px_rgba(16,185,129,0.5)] hover:-translate-y-2 hover:scale-[1.01] group">
          <h2 className="font-bold text-xl mb-1 group-hover:text-emerald-400 transition-colors">Study Schedule - {selectedDate.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'})}</h2>
          <p className="text-sm text-gray-400 mb-5">{filteredTasks.length} tasks</p>
          <div className="space-y-3">
            {filteredTasks.map(t=>(
              <div key={t.id} className="p-4 rounded-xl flex justify-between items-center border-l-4 bg-black/30 border-[#6C5CE7] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:border-emerald-400 cursor-pointer">
                <div><p className="font-bold">{t.subject}</p><p className="text-sm text-gray-400">{t.time} • {t.duration}</p></div>
                <div className="flex gap-2">
                  <button onClick={()=>startFocusMode(t)} className="px-3 py-1 bg-[#FFF8E7] text-black rounded-full text-xs font-bold hover:scale-125 transition-all">🍦 Focus Tab</button>
                  <button onClick={()=>startFocusingTask(t)} className="px-3 py-1 bg-[#6C5CE7] rounded-full text-xs font-bold hover:scale-125 transition-all">▶ Focus</button>
                  <button onClick={()=>deleteTask(t.id)} className="px-3 py-1 bg-white/10 rounded-full text-xs hover:bg-red-600 hover:scale-125 transition-all">🗑 Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT - ORANGE GLOW */}
        <div className="lg:col-span-3 bg-[#121424] p-5 rounded-2xl border border-white/5 h-fit transition-all duration-500 hover:border-orange-500/50 hover:shadow-[0_20px_60px_-15px_rgba(249,115,22,0.5)] hover:-translate-y-2 hover:rotate-[-0.5deg] hover:scale-[1.02] group">
          <div className="flex justify-between items-center mb-4 gap-1">
            <button onClick={()=>changeYear(-1)} className="px-2 py-1 bg-white/10 rounded-full hover:bg-orange-500 hover:scale-125 transition-all">«</button>
            <button onClick={()=>changeMonth(-1)} className="px-2 py-1 bg-white/10 rounded-full hover:bg-orange-500 hover:scale-125 transition-all">‹</button>
            <div className="flex gap-1">
              <select value={viewDate.getMonth()} onChange={e=>{const d=new Date(viewDate); d.setMonth(parseInt(e.target.value)); setViewDate(d);}} className="bg-[#1E213A] border border-orange-500/30 font-bold text-sm px-2 py-1.5 rounded-lg hover:border-orange-400 transition-all">
                {months.map((m,i)=><option key={m} value={i} className="bg-white text-black">{m}</option>)}
              </select>
              <select value={viewDate.getFullYear()} onChange={e=>{const d=new Date(viewDate); d.setFullYear(parseInt(e.target.value)); setViewDate(d);}} className="bg-[#1E213A] border border-orange-500/30 font-bold text-sm px-2 py-1.5 rounded-lg hover:border-orange-400 transition-all">
                {Array.from({length: 10}, (_,i)=> new Date().getFullYear()-2 + i).map(y=><option key={y} value={y} className="bg-white text-black">{y}</option>)}
              </select>
            </div>
            <button onClick={()=>changeMonth(1)} className="px-2 py-1 bg-white/10 rounded-full hover:bg-orange-500 hover:scale-125 transition-all">›</button>
            <button onClick={()=>changeYear(1)} className="px-2 py-1 bg-white/10 rounded-full hover:bg-orange-500 hover:scale-125 transition-all">»</button>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-[13px] text-center">
            {Array.from({length: new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()}, (_,i)=><div key={'e'+i}></div>)}
            {Array.from({length: new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 0).getDate()},(_,i)=>{
              const day = i+1;
              const dObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
              const isSel = dObj.toDateString() === selectedDateStr;
              return <div key={day} onClick={()=>setSelectedDate(dObj)} className={`p-2 rounded-lg cursor-pointer font-bold transition-all hover:z-10 ${isSel? 'bg-[#6C5CE7] text-white scale-110 shadow-[0_0_20px_#6C5CE7]' : 'bg-white/[0.07] hover:bg-orange-500 hover:text-white hover:scale-[1.4] hover:shadow-[0_0_20px_orange] hover:-translate-y-1 active:scale-90'}`}>{day}</div>
            })}
          </div>
        </div>
      </div>
    </div>
  );
}