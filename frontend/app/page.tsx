"use client";
import { useState, useEffect, useRef } from "react";
type Task = { id:number; subject:string; time:string; duration:string; status: 'pending' | 'completed' | 'missed', date: string };

export default function SmartScheduler() {
  const API_URL = "https://smart-study-scheduler-backend-qtpe.onrender.com";
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sub, setSub] = useState("");
  const [timeHour, setTimeHour] = useState("10");
  const [timeMin, setTimeMin] = useState("00");
  const [ampm, setAmPm] = useState("AM");
  const [dur, setDur] = useState("2 hours");
  const [notif, setNotif] = useState<string|null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const selectedDateStr = selectedDate.toDateString();

  // TIMER STATES
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [initialTime, setInitialTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [currentFocusTask, setCurrentFocusTask] = useState<Task | null>(null);
  const [customMins, setCustomMins] = useState("25");
  const [showCelebration, setShowCelebration] = useState(false);

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
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 4000);
      if(currentFocusTask){ setTasks(prev => prev.map(x=> x.id===currentFocusTask.id? {...x, status:'completed'} as any : x)); setCurrentFocusTask(null); }
      setIsBreak(!isBreak);
      setPomodoroTime(isBreak? initialTime : 5 * 60);
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, pomodoroTime, isBreak, initialTime, currentFocusTask]);

  const addTask = async () => {
    if(!sub) return;
    const finalTime = `${timeHour}:${timeMin} ${ampm}`;
    const newTask: Task = {id: Date.now(), subject:sub, time: finalTime, duration:dur, status:'pending', date: selectedDateStr};
    setTasks([...tasks, newTask]); setSub(""); setNotif(`Added: ${sub}`); setTimeout(()=>setNotif(null), 3000);
  };

  // FIX 1: Focus button ab kaam karega
  const startFocusingTask = (task: Task) => {
    setCurrentFocusTask(task);
    setIsBreak(false);
    setIsRunning(true);
    setPomodoroTime(initialTime);
    setNotif(`▶ Focusing: ${task.subject}`);
    setTimeout(()=>setNotif(null), 3000);
  };

  const deleteTask = (id:number) => setTasks(tasks.filter(t=>t.id!==id));
  const changeMonth = (delta: number) => setViewDate(prev => { const d = new Date(prev); d.setMonth(prev.getMonth()+delta); return d; });
  const changeYear = (delta: number) => setViewDate(prev => { const d = new Date(prev); d.setFullYear(prev.getFullYear()+delta); return d; });
  const filteredTasks = tasks.filter(t => t.date === selectedDateStr);
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const formatTime = (sec:number) => `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;

  // FIX 2: Custom minute logic - 12,13,17,18 allowed
  const applyCustomTime = () => {
    const m = parseInt(customMins);
    if(!isNaN(m) && m>=1 && m<=120){
      setPomodoroTime(m*60);
      setInitialTime(m*60);
      setIsRunning(false);
      setNotif(`Timer set to ${m} mins`);
      setTimeout(()=>setNotif(null), 2000);
    }
  };

  return (
    <div className="bg-[#050711] text-white min-h-screen">
      <nav className="flex justify-between items-center p-4 border-b border-white/10 sticky top-0 bg-[#080A14]/80 backdrop-blur-md z-10">
        <h1 className="text-xl font-black hover:scale-105 transition-transform cursor-default">SMART STUDY SCHEDULER <span className="bg-[#6C5CE7] text-xs px-2 py-1 rounded ml-2">PRO</span></h1>
        <div className="flex gap-3">
          <button onClick={()=>{const now=new Date(); setSelectedDate(now); setViewDate(now);}} className="px-5 py-2 bg-white/10 rounded-full hover:bg-white hover:text-black hover:scale-110 transition-all cursor-pointer">Today</button>
          <button onClick={()=>setIsRunning(!isRunning)} className="px-5 py-2 bg-gradient-to-r from-[#6C5CE7] to-[#A855F7] rounded-full font-bold hover:scale-110 hover:shadow-[0_0_25px_#6C5CE7] transition-all cursor-pointer">{isRunning? 'Pause':'Start Focus'}</button>
        </div>
      </nav>
      {notif && <div className="fixed top-20 right-5 bg-[#6C5CE7] px-6 py-3 rounded-xl shadow-[0_0_30px_#6C5CE7] z-50 animate-bounce">{notif}</div>}
      {showCelebration && <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]"><div className="bg-gradient-to-br from-[#6C5CE7] to-[#A855F7] p-8 rounded-3xl text-center animate-bounce"><div className="text-6xl mb-2">🎉</div><h2 className="text-2xl font-black">Task Complete!</h2></div></div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-[1600px] mx-auto">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-3 space-y-6">
          {/* ADD FOR - PURPLE GLOW */}
          <div className="bg-[#121424] p-5 rounded-2xl border border-white/5 h-fit transition-all duration-500 hover:border-[#6C5CE7]/50 hover:shadow-[0_20px_60px_-15px_rgba(108,92,231,0.5)] hover:-translate-y-2 hover:scale-[1.02] group">
            <h2 className="font-bold mb-2 group-hover:text-[#6C5CE7]">+ Add for</h2>
            <p className="text-xs text-[#6C5CE7] font-bold mb-3">{selectedDate.toLocaleDateString('en-IN', {weekday:'short', day:'numeric', month:'short', year:'numeric'})}</p>
            <input value={sub} onChange={e=>setSub(e.target.value)} placeholder="Subject e.g. Python" className="w-full bg-black/50 p-3 rounded-lg mb-3 border border-white/10 outline-none focus:border-[#6C5CE7] transition-all" />
            <div className="flex gap-2 mb-3">
              <div className="flex gap-1 w-[60%] bg-black/50 p-2 rounded-lg border border-white/10 items-center">
                <select value={timeHour} onChange={e=>setTimeHour(e.target.value)} className="bg-transparent outline-none w-1/3 text-center cursor-pointer">{Array.from({length:12},(_,i)=>{const h=i+1; return <option key={h} value={String(h).padStart(2,'0')} className="text-black">{String(h).padStart(2,'0')}</option>})}</select>
                <span>:</span>
                <select value={timeMin} onChange={e=>setTimeMin(e.target.value)} className="bg-transparent outline-none w-1/3 text-center cursor-pointer">{["00","15","30","45"].map(m=><option key={m} value={m} className="text-black">{m}</option>)}</select>
                <select value={ampm} onChange={e=>setAmPm(e.target.value)} className="bg-[#6C5CE7] rounded-md px-2 py-1 font-bold ml-1 cursor-pointer"><option value="AM" className="text-black">AM</option><option value="PM" className="text-black">PM</option></select>
              </div>
              <input value={dur} onChange={e=>setDur(e.target.value)} className="w-[40%] bg-black/50 p-3 rounded-lg border border-white/10" />
            </div>
            <button onClick={addTask} className="w-full py-3 bg-[#6C5CE7] rounded-xl font-bold hover:scale-[1.05] hover:shadow-[0_0_30px_#6C5CE7] active:scale-95 transition-all cursor-pointer">Add Task + Reminder</button>
          </div>

          {/* CLOCK WINDOW - WAPAS AAYA - CUSTOM MINUTES */}
          <div className="bg-[#121424] p-5 rounded-2xl border border-white/5 transition-all duration-500 hover:border-[#6C5CE7]/50 hover:shadow-[0_20px_60px_-15px_rgba(108,92,231,0.4)] hover:-translate-y-1 group">
            <h2 className="font-bold mb-1 group-hover:text-[#6C5CE7]">⏰ Focus Clock</h2>
            <p className="text-xs text-gray-400 mb-3">{currentFocusTask? `Focusing: ${currentFocusTask.subject}` : isBreak? "Break Time ☕" : "Ready to focus"}</p>

            <div className="bg-black/50 rounded-xl p-4 text-center border border-white/10 mb-4">
              <div className="text-5xl font-black tracking-widest tabular-nums">{formatTime(pomodoroTime)}</div>
              <div className="flex justify-center gap-2 mt-3">
                <button onClick={()=>{setPomodoroTime(p=>Math.max(60, p-60)); if(!isBreak) setInitialTime(p=>Math.max(60, p-60))}} className="px-3 py-1 bg-white/10 rounded-full hover:bg-[#6C5CE7] hover:scale-110 transition-all">-1m</button>
                <button onClick={()=>setIsRunning(!isRunning)} className="px-6 py-1 bg-[#6C5CE7] rounded-full font-bold hover:scale-110 hover:shadow-[0_0_15px_#6C5CE7] transition-all">{isRunning? 'Pause':'Start'}</button>
                <button onClick={()=>{setPomodoroTime(p=>Math.min(7200, p+60)); if(!isBreak) setInitialTime(p=>Math.min(7200, p+60))}} className="px-3 py-1 bg-white/10 rounded-full hover:bg-[#6C5CE7] hover:scale-110 transition-all">+1m</button>
              </div>
              <button onClick={()=>{setPomodoroTime(initialTime); setIsRunning(false);}} className="mt-3 text-xs text-gray-400 hover:text-white underline">Reset</button>
            </div>

            {/* CUSTOM INPUT - AB 12,13,17,18 sab allowed */}
            <div className="flex gap-2">
              <input type="number" min="1" max="120" value={customMins} onChange={e=>setCustomMins(e.target.value)} placeholder="e.g. 13" className="w-[60%] bg-black/50 p-2.5 rounded-lg border border-white/10 outline-none focus:border-[#6C5CE7] text-center" />
              <button onClick={applyCustomTime} className="w-[40%] bg-white text-black font-bold rounded-lg hover:bg-[#6C5CE7] hover:text-white hover:scale-105 transition-all">Set Mins</button>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 text-center">1 se 120 min tak koi bhi number daal sakta hai (12,13,17,19 bhi)</p>
          </div>
        </div>

        {/* MIDDLE - GREEN GLOW */}
        <div className="lg:col-span-6 bg-[#121424] p-5 rounded-2xl border border-white/5 min-h-[500px] transition-all duration-500 hover:border-emerald-500/40 hover:shadow-[0_20px_60px_-15px_rgba(16,185,129,0.4)] hover:-translate-y-2 hover:scale-[1.01] group">
          <h2 className="font-bold text-xl mb-1 group-hover:text-emerald-400">Study Schedule - {selectedDate.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'})}</h2>
          <p className="text-sm text-gray-400 mb-5">{filteredTasks.length} tasks for this date</p>
          <div className="space-y-3">
            {filteredTasks.map(t=>(
              <div key={t.id} className="p-4 rounded-xl flex justify-between items-center border-l-4 bg-black/30 border-[#6C5CE7] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:border-emerald-400 cursor-pointer">
                <div><p className="font-bold">{t.subject}</p><p className="text-sm text-gray-400">{t.time} • {t.duration}</p></div>
                <div className="flex gap-2">
                  <button onClick={()=>startFocusMode(t)} className="px-3 py-1 bg-[#FFF8E7] text-black rounded-full text-xs font-bold border hover:scale-110 hover:shadow-[0_0_15px_white] transition-all cursor-pointer">🍦 Focus Tab</button>
                  <button onClick={()=>startFocusingTask(t)} className="px-3 py-1 bg-gradient-to-r from-[#6C5CE7] to-[#A855F7] rounded-full text-xs font-bold hover:scale-110 hover:shadow-[0_0_15px_#6C5CE7] transition-all cursor-pointer">▶ Focus</button>
                  <button onClick={()=>deleteTask(t.id)} className="px-3 py-1 bg-white/10 rounded-full text-xs hover:bg-red-600 hover:scale-110 transition-all cursor-pointer">🗑 Delete</button>
                </div>
              </div>
            ))}
            {filteredTasks.length===0 && <div className="text-center py-10 text-gray-500">📅 No tasks for this date</div>}
          </div>
        </div>

        {/* RIGHT - ORANGE GLOW */}
        <div className="lg:col-span-3 bg-[#121424] p-5 rounded-2xl border border-white/5 h-fit transition-all duration-500 hover:border-orange-500/40 hover:shadow-[0_20px_60px_-15px_rgba(249,115,22,0.4)] hover:-translate-y-2 hover:rotate-[-0.5deg] hover:scale-[1.02] group">
          <div className="flex justify-between items-center mb-4 gap-1">
            <button onClick={()=>changeYear(-1)} className="px-2.5 py-1.5 bg-white/10 rounded-full hover:bg-orange-500 hover:scale-125 transition-all">«</button>
            <button onClick={()=>changeMonth(-1)} className="px-3 py-1.5 bg-white/10 rounded-full hover:bg-orange-500 hover:scale-125 transition-all">‹</button>
            <div className="text-center flex gap-1">
              <select value={viewDate.getMonth()} onChange={e=>{const d=new Date(viewDate); d.setMonth(parseInt(e.target.value)); setViewDate(d);}} className="bg-[#1E213A] border border-orange-500/30 font-bold text-sm px-2 py-1.5 rounded-lg hover:border-orange-400 transition-all">
                {months.map((m,i)=><option key={m} value={i} className="bg-white text-black">{m}</option>)}
              </select>
              <select value={viewDate.getFullYear()} onChange={e=>{const d=new Date(viewDate); d.setFullYear(parseInt(e.target.value)); setViewDate(d);}} className="bg-[#1E213A] border border-orange-500/30 font-bold text-sm px-2 py-1.5 rounded-lg ml-1 transition-all">
                {Array.from({length: 10}, (_,i)=> new Date().getFullYear()-2 + i).map(y=><option key={y} value={y} className="bg-white text-black">{y}</option>)}
              </select>
            </div>
            <button onClick={()=>changeMonth(1)} className="px-3 py-1.5 bg-white/10 rounded-full hover:bg-orange-500 hover:scale-125 transition-all">›</button>
            <button onClick={()=>changeYear(1)} className="px-2.5 py-1.5 bg-white/10 rounded-full hover:bg-orange-500 hover:scale-125 transition-all">»</button>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-[13px] text-center">
            {Array.from({length: new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()}, (_,i)=><div key={'e'+i}></div>)}
            {Array.from({length: new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 0).getDate()},(_,i)=>{
              const day = i+1;
              const dObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
              const isSel = dObj.toDateString() === selectedDateStr;
              const hasTasks = tasks.some(t=>t.date === dObj.toDateString());
              return <div key={day} onClick={()=>setSelectedDate(dObj)} className={`p-2 rounded-lg cursor-pointer font-bold transition-all duration-300 hover:z-10 ${isSel? 'bg-[#6C5CE7] text-white scale-110 shadow-[0_0_20px_#6C5CE7]' : 'bg-white/[0.07] hover:bg-orange-500 hover:text-white hover:scale-[1.4] hover:shadow-[0_0_20px_orange] hover:-translate-y-1 active:scale-90'}`}>{day}{hasTasks &&!isSel && <div className="w-1 h-1 bg-orange-400 rounded-full mx-auto mt-1"></div>}</div>
            })}
          </div>
        </div>
      </div>
    </div>
  );
}