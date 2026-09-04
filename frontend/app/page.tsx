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

  // LOAD - pehle localStorage se, fir backend se
  useEffect(()=>{
    const saved = localStorage.getItem("smart_tasks");
    if(saved){
      try{ setTasks(JSON.parse(saved)); }catch(e){}
    }
    fetch(`${API_URL}/api/tasks`).then(r=>r.json()).then(d=>{
      if(Array.isArray(d) && d.length>0){
        const mapped = d.map((t:any)=>({...t, status: t.status || 'pending', date: t.date || new Date().toDateString()}));
        setTasks(mapped);
      }
    }).catch(()=>{});
    if(typeof Notification!== "undefined" && Notification.permission!== "granted") Notification.requestPermission();
  },[]);

  // SAVE - har baar tasks change pe localStorage me save
  useEffect(()=>{
    localStorage.setItem("smart_tasks", JSON.stringify(tasks));
  },[tasks]);

  useEffect(() => {
    let interval: any;
    if (isRunning && pomodoroTime > 0) {
      interval = setInterval(() => setPomodoroTime(t => t - 1), 1000);
    } else if (isRunning && pomodoroTime === 0) {
      const msg = currentFocusTask? `🎉 ${currentFocusTask.subject} complete!` : "Pomodoro Done! Break lo ☕";
      showNotify(msg);
      setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 4000);
      if(currentFocusTask){
        setTasks(prev => prev.map(t=> t.id===currentFocusTask.id? {...t, status:'completed'} : t));
        setCurrentFocusTask(null);
      }
      setIsBreak(!isBreak);
      setPomodoroTime(isBreak? initialTime : 5 * 60);
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, pomodoroTime, isBreak, currentFocusTask, initialTime]);

  const showNotify = (msg:string) => {
    setNotif(msg);
    if(typeof Notification!== "undefined" && Notification.permission === "granted") new Notification("SMART STUDY SCHEDULER", {body: msg});
    audioRef.current?.play();
    setTimeout(()=>setNotif(null), 4000);
  };

  const addTask = async () => {
    if(!sub) return;
    const finalTime = `${timeHour}:${timeMin} ${ampm}`;
    const newTask: Task = {id: Date.now(), subject:sub, time: finalTime, duration:dur, status:'pending', date: selectedDateStr};
    setTasks([...tasks, newTask]); // pehle UI me dikha
    try{
      const res = await fetch(`${API_URL}/api/add_task`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({subject:sub, time: finalTime, duration:dur, date: selectedDateStr}) });
      const data = await res.json();
      if(data.id) setTasks(prev => prev.map(t=> t.id===newTask.id? {...t, id:data.id}: t));
    }catch(e){}
    setSub("");
    showNotify(`Added for ${selectedDate.toLocaleDateString()}: ${sub}`);
  };

  const startFocusingTask = (task: Task) => {
    setCurrentFocusTask(task);
    setIsBreak(false);
    setIsRunning(true);
    setPomodoroTime(initialTime);
    showNotify(`▶ Focusing: ${task.subject}`);
  };

  const updateStatus = (id:number, status:'completed'|'missed', reason?:string) => {
    if (status === 'completed') {
      setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3500);
    }
    setTasks(tasks.map(t=> t.id===id? {...t, status, reason} : t));
  };

  const deleteTask = async (id:number) => {
    setTasks(tasks.filter(t=>t.id!==id));
    try{ await fetch(`${API_URL}/api/delete_task/${id}`, {method:"DELETE"}); }catch(e){}
  };

  const adjustTimer = (mins: number) => {
    if(isRunning) return;
    const newTime = Math.max(1*60, Math.min(120*60, pomodoroTime + mins*60));
    setPomodoroTime(newTime);
    if(!isBreak) setInitialTime(newTime);
  };

  const handleManualTimerSave = () => {
    const mins = parseInt(editMins);
    if(!isNaN(mins) && mins >=1 && mins <=120){
      setPomodoroTime(mins*60);
      setInitialTime(mins*60);
    }
    setIsEditingTimer(false);
  };

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const changeMonth = (delta: number) => setViewDate(prev => { const d = new Date(prev); d.setMonth(prev.getMonth()+delta); return d; });
  const changeYear = (delta: number) => setViewDate(prev => { const d = new Date(prev); d.setFullYear(prev.getFullYear()+delta); return d; });

  const filteredTasks = tasks.filter(t => t.date === selectedDateStr);

  return (
    <div className="bg-[#050711] text-white min-h-screen perspective-[2000px]">
      <nav className="flex justify-between items-center p-4 border-b border-white/10 sticky top-0 bg-[#080A14]/80 backdrop-blur-md z-10">
        <h1 className="text-xl font-black tracking-wider hover:scale-105 transition-transform cursor-default">SMART STUDY SCHEDULER <span className="bg-[#6C5CE7] text-xs px-2 py-1 rounded ml-2 animate-pulse">PRO</span></h1>
        <div className="flex gap-3">
          <button onClick={()=>{const now=new Date(); setSelectedDate(now); setViewDate(now);}} className="px-5 py-2 bg-white/10 rounded-full hover:bg-white hover:text-black hover:scale-110 hover:shadow-[0_0_20px_white] active:scale-95 transition-all duration-300 cursor-pointer">Today</button>
          <button onClick={()=>{setIsRunning(true); setIsBreak(false);}} className="px-5 py-2 bg-gradient-to-r from-[#6C5CE7] to-[#A855F7] rounded-full font-bold hover:scale-110 hover:shadow-[0_0_25px_#6C5CE7] active:scale-90 transition-all duration-300 cursor-pointer">Start Focus</button>
        </div>
      </nav>

      {notif && <div className="fixed top-20 right-5 bg-[#6C5CE7] px-6 py-3 rounded-xl shadow-[0_0_30px_#6C5CE7] animate-bounce z-50">{notif}</div>}
      <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/beep_short.ogg" />
      {showCelebration && (<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100]"><div className="bg-gradient-to-br from-[#6C5CE7] to-[#A855F7] p-8 rounded-3xl text-center animate-bounce shadow-[0_0_50px_#6C5CE7] max-w-sm mx-4"><div className="text-6xl mb-4">🎉</div><h2 className="text-2xl font-black mb-2">CONGRATULATIONS!</h2><p className="font-semibold">{quote}</p><button onClick={()=>setShowCelebration(false)} className="mt-6 px-6 py-2 bg-white text-black rounded-full font-bold hover:scale-110 transition-all">Let's Go!</button></div></div>)}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-[1600px] mx-auto">
        <div className="lg:col-span-3 bg-[#121424] p-5 rounded-2xl border border-white/5 h-fit transition-all duration-500 hover:border-[#6C5CE7]/50 hover:shadow-[0_20px_60px_-15px_rgba(108,92,231,0.5)] hover:-translate-y-2 hover:rotate-[0.5deg] hover:scale-[1.02] group">
          <h2 className="font-bold mb-2 group-hover:text-[#6C5CE7] transition-colors">+ Add for</h2>
          <p className="text-xs text-[#6C5CE7] font-bold mb-3">{selectedDate.toLocaleDateString('en-IN', {weekday:'short', day:'numeric', month:'short', year:'numeric'})}</p>
          <input value={sub} onChange={e=>setSub(e.target.value)} placeholder="Subject e.g. Python" className="w-full bg-black/50 p-3 rounded-lg mb-3 border border-white/10 outline-none focus:border-[#6C5CE7] focus:shadow-[0_0_15px_#6C5CE7] focus:scale-[1.02] transition-all cursor-text" />
          <div className="flex gap-2 mb-3">
            <div className="flex gap-1 w-[60%] bg-black/50 p-2 rounded-lg border border-white/10 items-center hover:border-[#6C5CE7]/30 transition-all">
              <select value={timeHour} onChange={e=>setTimeHour(e.target.value)} className="bg-transparent outline-none w-1/3 text-center cursor-pointer hover:text-[#6C5CE7]">{Array.from({length:12},(_,i)=>{const h=i+1; const val=String(h).padStart(2,'0'); return <option key={h} value={val} className="text-black">{val}</option>})}</select>
              <span>:</span>
              <select value={timeMin} onChange={e=>setTimeMin(e.target.value)} className="bg-transparent outline-none w-1/3 text-center cursor-pointer hover:text-[#6C5CE7]">{["00","15","30","45"].map(m=><option key={m} value={m} className="text-black">{m}</option>)}</select>
              <select value={ampm} onChange={e=>setAmPm(e.target.value)} className="bg-[#6C5CE7] rounded-md px-2 py-1 font-bold ml-1 cursor-pointer hover:scale-110 active:scale-90 transition-all"><option value="AM" className="text-black">AM</option><option value="PM" className="text-black">PM</option></select>
            </div>
            <input value={dur} onChange={e=>setDur(e.target.value)} placeholder="2 hours" className="w-[40%] bg-black/50 p-3 rounded-lg border border-white/10 focus:border-[#6C5CE7] transition-all cursor-text" />
          </div>
          <button onClick={addTask} className="w-full py-3 bg-[#6C5CE7] rounded-xl font-bold hover:scale-[1.05] hover:shadow-[0_0_30px_#6C5CE7] hover:brightness-125 active:scale-95 active:shadow-[0_0_10px_#6C5CE7] transition-all duration-300 cursor-pointer">Add Task + Reminder</button>

          <div className="mt-8 bg-black/30 p-4 rounded-xl border border-white/10 text-center hover:border-[#6C5CE7]/30 hover:shadow-[inset_0_0_20px_rgba(108,92,231,0.2)] transition-all duration-300">
            <h3 className="font-bold mb-2">{currentFocusTask? `Focusing: ${currentFocusTask.subject}` : "🍅 Focus Timer"}</h3>
            {isEditingTimer? (
              <div className="my-3 flex gap-2 justify-center"><input autoFocus type="number" value={editMins} onChange={e=>setEditMins(e.target.value)} onKeyDown={e=> e.key==='Enter' && handleManualTimerSave()} className="w-20 bg-white text-black p-2 rounded-lg text-center font-black text-xl" /><button onClick={handleManualTimerSave} className="px-3 py-2 bg-[#6C5CE7] rounded-lg font-bold hover:scale-110 active:scale-90 transition-all cursor-pointer">OK</button></div>
            ) : (
              <div onClick={()=>{ if(!isRunning){ setEditMins(String(Math.floor(pomodoroTime/60))); setIsEditingTimer(true);} }} className={`text-5xl font-black my-3 cursor-pointer hover:scale-110 hover:text-[#6C5CE7] transition-all duration-300 ${isRunning? 'animate-pulse text-[#6C5CE7]' : ''}`}>{String(Math.floor(pomodoroTime / 60)).padStart(2, '0')}:{String(pomodoroTime % 60).padStart(2, '0')}</div>
            )}
            <div className="flex justify-center gap-2 mb-3">
              <button disabled={isRunning} onClick={()=>adjustTimer(-5)} className="px-3 py-1 bg-white/10 rounded-full text-sm hover:bg-[#6C5CE7] hover:text-white hover:scale-125 active:scale-90 transition-all cursor-pointer">-5m</button>
              <button disabled={isRunning} onClick={()=>adjustTimer(-1)} className="px-3 py-1 bg-white/10 rounded-full text-sm hover:bg-[#6C5CE7] hover:text-white hover:scale-125 active:scale-90 transition-all cursor-pointer">-1m</button>
              <button disabled={isRunning} onClick={()=>adjustTimer(1)} className="px-3 py-1 bg-white/10 rounded-full text-sm hover:bg-[#6C5CE7] hover:text-white hover:scale-125 active:scale-90 transition-all cursor-pointer">+1m</button>
              <button disabled={isRunning} onClick={()=>adjustTimer(5)} className="px-3 py-1 bg-white/10 rounded-full text-sm hover:bg-[#6C5CE7] hover:text-white hover:scale-125 active:scale-90 transition-all cursor-pointer">+5m</button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsRunning(!isRunning)} className={`flex-1 py-2.5 rounded-lg font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-90 cursor-pointer ${isRunning? 'bg-yellow-500 text-black hover:shadow-[0_0_20px_yellow]' : 'bg-white text-black hover:shadow-[0_0_20px_white]'}`}>{isRunning? "⏸ Pause" : "▶ Start"}</button>
              <button onClick={() => { setIsRunning(false); setPomodoroTime(initialTime); }} className="flex-1 py-2.5 bg-white/10 rounded-lg font-bold hover:bg-white/20 hover:scale-105 active:scale-90 transition-all cursor-pointer">↺ Reset</button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 bg-[#121424] p-5 rounded-2xl border border-white/5 min-h-[500px] transition-all duration-500 hover:border-emerald-500/40 hover:shadow-[0_20px_60px_-15px_rgba(16,185,129,0.4)] hover:-translate-y-2 hover:scale-[1.01] group">
          <h2 className="font-bold text-xl mb-1 group-hover:text-emerald-400 transition-colors">Study Schedule - {selectedDate.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric', year:'numeric'})}</h2>
          <p className="text-sm text-gray-400 mb-5">{filteredTasks.length} tasks for this date</p>
          <div className="space-y-3">
            {filteredTasks.length === 0 && <div className="text-center py-10 text-gray-500 hover:text-white transition-colors">📅 No tasks for this date</div>}
            {filteredTasks.map(t=>(
              <div key={t.id} className={`p-4 rounded-xl flex justify-between items-center border-l-4 bg-black/30 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:-translate-y-1 cursor-pointer active:scale-[0.98] ${t.status==='completed'?'border-green-500 opacity-60 hover:opacity-80': t.status==='missed'?'border-red-500':'border-[#6C5CE7] hover:border-emerald-400'}`}>
                <div><p className={`font-bold ${t.status==='completed'?'line-through':''}`}>{t.subject}</p><p className="text-sm text-gray-400">{t.time} • {t.duration} • {t.status}</p></div>
                <div className="flex gap-2 flex-wrap justify-end max-w-[60%]">
                  {t.status==='pending' && <>
                    <button onClick={()=>startFocusingTask(t)} className="px-3 py-1 bg-gradient-to-r from-[#6C5CE7] to-[#A855F7] rounded-full text-xs font-bold hover:scale-125 hover:shadow-[0_0_15px_#6C5CE7] active:scale-90 transition-all cursor-pointer">▶ Focus</button>
                    <button onClick={()=>updateStatus(t.id,'completed')} className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs hover:bg-green-500 hover:text-white hover:scale-125 active:scale-90 transition-all cursor-pointer">✓ Complete</button>
                    <button onClick={()=>{const r=prompt("Reason?"); if(r) updateStatus(t.id,'missed', r)}} className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs hover:bg-red-500 hover:text-white hover:scale-125 active:scale-90 transition-all cursor-pointer">✕ Missed</button>
                  </>}
                  <button onClick={()=>deleteTask(t.id)} className="px-3 py-1 bg-white/10 rounded-full text-xs hover:bg-red-600 hover:scale-125 active:scale-90 transition-all cursor-pointer">🗑 Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 bg-[#121424] p-5 rounded-2xl border border-white/5 h-fit transition-all duration-500 hover:border-orange-500/40 hover:shadow-[0_20px_60px_-15px_rgba(249,115,22,0.4)] hover:-translate-y-2 hover:rotate-[-0.5deg] hover:scale-[1.02] group">
          <div className="flex justify-between items-center mb-4 gap-1">
            <button onClick={()=>changeYear(-1)} className="px-2.5 py-1.5 bg-white/10 rounded-full hover:bg-orange-500 hover:text-white hover:scale-125 hover:shadow-[0_0_15px_orange] active:scale-75 transition-all cursor-pointer">«</button>
            <button onClick={()=>changeMonth(-1)} className="px-3 py-1.5 bg-white/10 rounded-full hover:bg-orange-500 hover:text-white hover:scale-125 active:scale-75 transition-all cursor-pointer">‹</button>
            <div className="text-center flex gap-1">
              <select value={viewDate.getMonth()} onChange={e=>{const d=new Date(viewDate); d.setMonth(parseInt(e.target.value)); setViewDate(d);}} className="bg-[#1E213A] border border-orange-500/30 font-bold text-sm outline-none cursor-pointer text-white px-2 py-1.5 rounded-lg hover:border-orange-400 hover:shadow-[0_0_10px_orange] transition-all">
                {months.map((m,i)=><option key={m} value={i} className="bg-white text-black">{m}</option>)}
              </select>
              <select value={viewDate.getFullYear()} onChange={e=>{const d=new Date(viewDate); d.setFullYear(parseInt(e.target.value)); setViewDate(d);}} className="bg-[#1E213A] border border-orange-500/30 font-bold text-sm outline-none cursor-pointer text-white px-2 py-1.5 rounded-lg ml-1 hover:border-orange-400 transition-all">
                {Array.from({length: 10}, (_,i)=> new Date().getFullYear()-2 + i).map(y=><option key={y} value={y} className="bg-white text-black">{y}</option>)}
              </select>
            </div>
            <button onClick={()=>changeMonth(1)} className="px-3 py-1.5 bg-white/10 rounded-full hover:bg-orange-500 hover:text-white hover:scale-125 active:scale-75 transition-all cursor-pointer">›</button>
            <button onClick={()=>changeYear(1)} className="px-2.5 py-1.5 bg-white/10 rounded-full hover:bg-orange-500 hover:text-white hover:scale-125 hover:shadow-[0_0_15px_orange] active:scale-75 transition-all cursor-pointer">»</button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-[11px] text-center text-white/70 mb-2 font-bold"><div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div></div>
          <div className="grid grid-cols-7 gap-1.5 text-[13px] text-center">
            {Array.from({length: new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()}, (_,i)=><div key={'empty-'+i}></div>)}
            {Array.from({length: new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 0).getDate()},(_,i)=>{
              const day = i+1;
              const dateObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
              const dateStr = dateObj.toDateString();
              const isSelected = dateStr === selectedDateStr;
              const isToday = dateStr === new Date().toDateString();
              const hasTasks = tasks.some(t=>t.date === dateStr);
              return (
                <div key={day} onClick={()=>setSelectedDate(dateObj)}
                className={`p-2 rounded-lg cursor-pointer transition-all duration-300 font-bold relative hover:z-10
                  ${isSelected? 'bg-[#6C5CE7] text-white font-black scale-110 shadow-[0_0_20px_#6C5CE7] border border-white/20'
                  : isToday? 'bg-white text-black font-black ring-2 ring-orange-400 shadow-[0_0_15px_white] scale-105'
                  : 'bg-white/[0.07] text-[#F3F4F6] hover:bg-orange-500 hover:text-white hover:scale-[1.4] hover:shadow-[0_0_20px_orange] hover:-translate-y-1 border border-white/10 active:scale-90'}`}>
                  {day}
                  {hasTasks &&!isSelected && <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mx-auto mt-1 animate-pulse"></div>}
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={()=>{const now=new Date(); setViewDate(now); setSelectedDate(now);}} className="flex-1 py-2.5 bg-[#6C5CE7] rounded-lg text-xs font-black hover:bg-orange-500 hover:scale-105 hover:shadow-[0_0_20px_orange] active:scale-90 transition-all duration-300 cursor-pointer">Go to Today</button>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-br from-[#6C5CE7]/20 to-orange-500/10 rounded-xl border border-white/10 hover:border-orange-500/30 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:scale-[1.02] transition-all duration-300">
            <p className="text-sm font-bold text-white">Progress: {filteredTasks.filter(t=>t.status==='completed').length}/{filteredTasks.length}</p>
            <div className="w-full bg-black/50 h-2 rounded-full mt-2 overflow-hidden"><div className="bg-gradient-to-r from-[#6C5CE7] to-orange-400 h-2 rounded-full transition-all duration-1000" style={{width:`${filteredTasks.length? (filteredTasks.filter(t=>t.status==='completed').length/filteredTasks.length)*100:0}%`}}></div></div>
            <p className="text-[10px] text-white/70 mt-2 font-medium">« » = Year, ‹ › = Month change</p>
          </div>
        </div>
      </div>
    </div>
  );
}