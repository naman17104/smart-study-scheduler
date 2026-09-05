"use client";
import { useState, useEffect, useRef } from "react";
type Task = { id:number; subject:string; time:string; duration:string; status: 'pending' | 'completed' | 'missed', date: string, notified?: boolean };
const MOTIVATIONAL_QUOTES = ["Boom! Ek aur jeet. Aise hi lage raho!","Great job! Consistency hi success hai.","Wah! Tumne kar dikhaya.","Another step closer to your goal.","Shabash! Focus ka result hai ye."];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DURATIONS = ["30 mins", "1 hour", "2 hours", "3 hours", "4 hours", "5 hours"];

export default function SmartScheduler() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sub, setSub] = useState("");
  const [timeHour, setTimeHour] = useState("10");
  const [timeMin, setTimeMin] = useState("00");
  const [ampm, setAmPm] = useState("AM");
  const [dur, setDur] = useState("2 hours");
  const [notif, setNotif] = useState<string|null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewDate, setViewDate] = useState<Date | null>(null);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [initialTime, setInitialTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [currentFocusTask, setCurrentFocusTask] = useState<Task | null>(null);
  const [customMins, setCustomMins] = useState("25");
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState("25");
  const [ringingTaskId, setRingingTaskId] = useState<number | null>(null);
  const [showAddBox, setShowAddBox] = useState(false);
  const [showMonthList, setShowMonthList] = useState(false);
  const [showYearList, setShowYearList] = useState(false);
  const [showHourList, setShowHourList] = useState(false);
  const [showMinList, setShowMinList] = useState(false);
  const [showAmPmList, setShowAmPmList] = useState(false);
  const [showDurList, setShowDurList] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<any>(null);

  // MOBILE: Wake Lock - screen off nahi hoga
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch(e){}
  };
  useEffect(()=>{
    if(isRunning) requestWakeLock();
    else {
      try{ wakeLockRef.current?.release(); }catch{}
    }
  },[isRunning]);

  // MOBILE: Audio unlock on first tap
  useEffect(()=>{
    const unlock = () => {
      if(audioRef.current){ audioRef.current.play().then(()=>{audioRef.current?.pause(); audioRef.current!.currentTime=0;}).catch(()=>{}); }
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };
    document.addEventListener('click', unlock);
    document.addEventListener('touchstart', unlock);
    return ()=>{ document.removeEventListener('click', unlock); document.removeEventListener('touchstart', unlock); }
  },[]);

  useEffect(()=>{
    const now = new Date(); setSelectedDate(now); setViewDate(now);
    const saved = localStorage.getItem("smart_tasks");
    if(saved){ try{ setTasks(JSON.parse(saved)); }catch(e){} }
    if("Notification" in window && Notification.permission === "default"){ Notification.requestPermission(); }
  },[]);
  useEffect(()=>{ if(tasks.length>0 || localStorage.getItem("smart_tasks")) localStorage.setItem("smart_tasks", JSON.stringify(tasks)); },[tasks]);

  useEffect(()=>{
    const check = () => {
      const now = new Date(); const nowDateStr = now.toDateString(); const nowHour = now.getHours(); const nowMin = now.getMinutes();
      tasks.forEach(t=>{
        if(t.notified || t.status!== 'pending') return; if(t.date!== nowDateStr) return;
        const [timePart, ampmPart] = t.time.split(' '); let [h, m] = timePart.split(':').map(Number);
        if(ampmPart === 'PM' && h!== 12) h+=12; if(ampmPart === 'AM' && h === 12) h=0;
        if(h === nowHour && m === nowMin){
          setNotif(`⏰ Reminder: ${t.subject} - Abhi ka time hai!`); setTimeout(()=>setNotif(null), 8000);

          // MOBILE: Vibrate + Notification
          if("vibrate" in navigator) navigator.vibrate([500,200,500,200,800]);
          if("Notification" in window && Notification.permission === "granted"){
            new Notification(`🔥 Study Time: ${t.subject}`, { body: `${t.time} - ${t.duration}`, vibrate: [500,200,500] as any, requireInteraction: true } as any);
          }
          try{
            if(audioRef.current){
              audioRef.current.volume=1.0; audioRef.current.currentTime=0;
              audioRef.current.play().catch(()=>{});
              setTimeout(()=>{audioRef.current?.pause();},8000);
            }
          }catch{}
          setRingingTaskId(t.id); setTimeout(()=>setRingingTaskId(null),8000);
          setTasks(prev => prev.map(x=> x.id===t.id? {...x, notified: true} as any : x));
        }
      });
    }; const id = setInterval(check, 5000); check(); return ()=>clearInterval(id);
  },[tasks]);

  useEffect(() => {
    let interval: any;
    if (isRunning && pomodoroTime > 0) { interval = setInterval(() => setPomodoroTime(t => t - 1), 1000); }
    else if (isRunning && pomodoroTime === 0) {
      setShowCelebration(true); setCelebrationText(MOTIVATIONAL_QUOTES[Math.floor(Math.random()*MOTIVATIONAL_QUOTES.length)]);
      if("vibrate" in navigator) navigator.vibrate([300,100,300]);
      setTimeout(() => setShowCelebration(false), 4000);
      if(currentFocusTask){ setTasks(prev => prev.map(x=> x.id===currentFocusTask.id? {...x, status:'completed'} as any : x)); }
      setIsRunning(false); setPomodoroTime(isBreak? initialTime : 5*60); setIsBreak(!isBreak);
    } return () => clearInterval(interval);
  }, [isRunning, pomodoroTime, isBreak, initialTime, currentFocusTask]);

  const selectedDateStr = selectedDate? selectedDate.toDateString() : "";
  const filteredTasks = tasks.filter(t => t.date === selectedDateStr);
  const completedCount = filteredTasks.filter(t=> t.status==='completed').length;
  const progressPct = filteredTasks.length? Math.round((completedCount / filteredTasks.length) * 100) : 0;

  useEffect(()=>{ const t = setTimeout(()=> setDisplayProgress(progressPct), 100); return ()=> clearTimeout(t); },[progressPct]);
  if(!selectedDate ||!viewDate) return <div className="bg-[#050711] min-h-screen flex items-center justify-center text-white">Loading...</div>;

  const addTask = () => {
    if(!sub) return;
    if("Notification" in window && Notification.permission!== "granted"){ Notification.requestPermission(); }
    const finalMin = String(parseInt(timeMin) || 0).padStart(2,'0'); const finalTime = `${timeHour}:${finalMin} ${ampm}`;
    const newTask: Task = {id: Date.now(), subject:sub, time: finalTime, duration:dur, status:'pending', date: selectedDateStr, notified: false};
    setTasks([...tasks, newTask]); setSub(""); setNotif(`Added: ${sub} at ${finalTime}`); setTimeout(()=>setNotif(null), 3000); setShowAddBox(false);
  };
  const completeTask = (task: Task) => { setTasks(prev => prev.map(x=> x.id===task.id? {...x, status:'completed'} as any : x)); setCelebrationText(MOTIVATIONAL_QUOTES[Math.floor(Math.random()*MOTIVATIONAL_QUOTES.length)]); setShowCelebration(true); setTimeout(()=>setShowCelebration(false),4000); }
  const startFocusMode = (task: Task) => { localStorage.setItem("focus_task", JSON.stringify(task)); window.open("/focus", "_blank") }
  const startFocusingTask = (task: Task) => { setCurrentFocusTask(task); setIsBreak(false); setIsRunning(true); setPomodoroTime(initialTime); requestWakeLock(); };
  const deleteTask = (id:number) => setTasks(tasks.filter(t=>t.id!==id));
  const changeMonth = (delta: number) => setViewDate(prev => { const d = new Date(prev!); d.setMonth(prev!.getMonth()+delta); return d; });
  const changeYear = (delta: number) => setViewDate(prev => { const d = new Date(prev!); d.setFullYear(prev!.getFullYear()+delta); return d; });
  const formatTime = (sec:number) => { const m = Math.floor(sec/60); const s = sec%60; return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; };
  const adjustTime = (delta:number) => { const newTime = Math.min(7200, Math.max(60, pomodoroTime + delta*60)); setPomodoroTime(newTime); if(!isBreak){ setInitialTime(newTime); } setCustomMins(String(Math.floor(newTime/60))); };
  const applyCustomTime = () => { const m = parseInt(customMins); if(!isNaN(m) && m>=1 && m<=120){ setPomodoroTime(m*60); setInitialTime(m*60); setIsRunning(false); setNotif(`Timer set to ${m} mins`); setTimeout(()=>setNotif(null), 2000); } };
  const saveDirectEdit = () => { const m = parseInt(editVal); if(!isNaN(m) && m>=1 && m<=120){ setPomodoroTime(m*60); setInitialTime(m*60); setCustomMins(String(m)); } setIsEditing(false); };

  return (
    <div className="bg-[#050711] text-white min-h-screen" suppressHydrationWarning>
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0) scale(1.05);}25%{transform:translateX(-6px) scale(1.08);}75%{transform:translateX(6px) scale(1.08);}}.animate-shake{animation:shake 0.3s infinite;}
        @keyframes liquidFlow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes glitter { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        @keyframes pop { 0% { transform: scale(0); } 60% { transform: scale(1.3); } 100% { transform: scale(1); } }
        @keyframes floatConfetti { 0% { transform: translateY(0) rotate(0deg); opacity:1; } 100% { transform: translateY(-200px) rotate(720deg); opacity:0; } }
      `}</style>
      <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg" preload="auto" />
      <nav className="flex justify-between items-center p-4 border-b border-white/10 sticky top-0 bg-[#080A14]/80 backdrop-blur-md z-20">
        <h1 className="text-xl font-black">SMART STUDY SCHEDULER <span className="bg-[#6C5CE7] text-xs px-2 py-1 rounded ml-2">PRO</span></h1>
        <div className="flex gap-3"><button onClick={()=>{const now=new Date(); setSelectedDate(now); setViewDate(now);}} className="px-5 py-2 bg-white/10 rounded-full hover:bg-white hover:text-black transition-all">Today</button><button onClick={()=>{setIsRunning(!isRunning); if(!isRunning) requestWakeLock();}} className="px-5 py-2 bg-gradient-to-r from-[#6C5CE7] to-[#A855F7] rounded-full font-bold hover:scale-110 transition-all">{isRunning? 'Pause':'Start Focus'}</button></div>
      </nav>
      {notif && <div className="fixed top-20 right-5 bg-[#6C5CE7] px-6 py-3 rounded-xl z-50 shadow-[0_0_20px_#6C5CE7] animate-bounce">{notif}</div>}

      {showCelebration && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-[6px] flex items-center justify-center z-[100] p-4">
          <div className="relative">
            <div className="absolute -top-8 -left-8 text-3xl animate-[floatConfetti_2s_ease_infinite]">🎉</div>
            <div className="absolute -top-6 -right-10 text-2xl animate-[floatConfetti_2.2s_ease_infinite_0.2s]">✨</div>
            <div className="absolute -bottom-6 -left-10 text-2xl animate-[floatConfetti_1.8s_ease_infinite_0.4s]">🎊</div>
            <div className="absolute -bottom-8 -right-8 text-3xl animate-[floatConfetti_2.1s_ease_infinite_0.6s]">🔥</div>
            <div className="bg-gradient-to-br from-[#FFD60A] via-[#FF8A00] to-[#FF006E] p-[3px] rounded-[32px] shadow-[0_0_60px_rgba(255,214,10,0.6)] animate-bounce">
              <div className="bg-[#0F0F1A] rounded-[29px] p-8 text-center max-w-[340px] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFD60A]/10 via-transparent to-[#FF006E]/10"></div>
                <div className="relative z-10">
                  <div className="text-6xl mb-3 drop-shadow-[0_0_20px_rgba(255,214,10,0.8)]">🎉</div>
                  <h2 className="text-[28px] font-black italic tracking-wide bg-gradient-to-r from-[#FFD60A] via-[#FF8A00] to-[#FF006E] bg-clip-text text-transparent" style={{fontFamily: 'Georgia, serif', fontStyle: 'italic'}}>Congratulations!</h2>
                  <div className="w-16 h-[2px] bg-gradient-to-r from-[#FFD60A] to-[#FF006E] mx-auto my-3 rounded-full"></div>
                  <p className="text-[15px] italic font-medium text-[#FFE082] leading-relaxed" style={{fontFamily: 'Georgia, serif'}}>"{celebrationText}"</p>
                  <p className="text-[10px] tracking-[0.2em] text-[#FF8A00]/70 mt-4 font-black">KEEP SHINING • YOU DID IT</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-[1600px] mx-auto">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#121424] p-5 rounded-2xl border border-white/5 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={()=>setShowAddBox(!showAddBox)} className={`w-9 h-9 rounded-full flex items-center justify-center text-[24px] font-black border border-white/20 transition-all duration-300 transform-gpu ${showAddBox? 'bg-gradient-to-br from-[#22c55e] to-[#16a34a] rotate-[135deg] scale-[1.15] shadow-[0_0_25px_#22c55e, inset_0_2px_4px_rgba(255,255,255,0.7)]' : 'bg-gradient-to-br from-[#FF6B6B] via-[#6C5CE7] to-[#00D2FF] shadow-[0_5px_15px_rgba(108,92,231,0.5)] hover:scale-[1.45] hover:rotate-[90deg] hover:shadow-[0_0_30px_#6C5CE7, inset_0_2px_5px_rgba(255,255,255,0.8)] active:scale-[0.85]'}`} style={{ transformStyle: 'preserve-3d' }}>+</button>
              <h2 onClick={()=>setShowAddBox(!showAddBox)} className="font-bold text-[17px] tracking-wide cursor-pointer">Add Task</h2>
            </div>
            <p className="text-xs text-[#6C5CE7] font-bold mb-3">{selectedDate.toLocaleDateString('en-IN', {weekday:'short', day:'numeric', month:'short', year:'numeric'})}</p>
            {showAddBox && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 relative">
              <input value={sub} onChange={e=>setSub(e.target.value)} placeholder="What would you like to do?" className="w-full bg-black/50 p-3 rounded-lg mb-3 border border-white/10 outline-none focus:border-[#6C5CE7]" autoFocus />
              <div className="flex gap-2 mb-3 relative z-10">
                <div className="flex gap-1 w-[60%] bg-black/30 p-1.5 rounded-xl border border-white/10 items-center backdrop-blur-md">
                  <div className="relative">
                    <button onClick={()=>{setShowHourList(!showHourList); setShowMinList(false); setShowAmPmList(false); setShowDurList(false);}} className="bg-gradient-to-br from-[#1E213A] to-[#121424] border border-[#6C5CE7]/50 font-black text-[12px] px-2.5 py-1.5 rounded-xl shadow-[0_4px_15px_rgba(108,92,231,0.3)] hover:scale-125 hover:border-pink-500 hover:shadow-[0_0_20px_#EC4899] transition-all duration-300 transform-gpu min-w-[32px]">{timeHour}</button>
                    {showHourList && (<div className="absolute top-[115%] left-0 bg-[#0A0C1A] border border-[#6C5CE7]/50 rounded-2xl p-2 w-[70px] z-[60] shadow-[0_20px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl grid grid-cols-1 gap-1 max-h-[180px] overflow-y-auto">{Array.from({length:12},(_,i)=> String(i+1).padStart(2,'0')).map(h=>{const isActive = h===timeHour; return <button key={h} onClick={()=>{setTimeHour(h); setShowHourList(false);}} className={`px-2 py-2 rounded-xl text-[12px] font-black transition-all duration-200 transform-gpu hover:scale-[1.2] ${isActive? 'bg-gradient-to-r from-[#6C5CE7] to-[#EC4899] text-white shadow-[0_0_15px_#6C5CE7] scale-[1.1]' : 'bg-white/5 hover:bg-[#6C5CE7] text-gray-300'}`}>{h}</button>})}</div>)}
                  </div>
                  <span className="font-black text-[#6C5CE7]">:</span>
                  <div className="relative">
                    <button onClick={()=>{setShowMinList(!showMinList); setShowHourList(false); setShowAmPmList(false); setShowDurList(false);}} className="bg-gradient-to-br from-[#1E213A] to-[#121424] border border-pink-500/40 font-black text-[12px] px-2.5 py-1.5 rounded-xl shadow-[0_4px_15px_rgba(236,72,153,0.3)] hover:scale-125 hover:border-[#6C5CE7] transition-all duration-300 transform-gpu min-w-[32px]">{timeMin}</button>
                    {showMinList && (<div className="absolute top-[115%] left-0 bg-[#0A0C1A] border border-pink-500/50 rounded-2xl p-2 w-[70px] z-[60] shadow-[0_20px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl grid grid-cols-1 gap-1 max-h-[180px] overflow-y-auto">{Array.from({length:60},(_,i)=> String(i).padStart(2,'0')).map(m=>{const isActive = m===timeMin; return <button key={m} onClick={()=>{setTimeMin(m); setShowMinList(false);}} className={`px-2 py-1.5 rounded-xl text-[11px] font-black transition-all hover:scale-[1.2] ${isActive? 'bg-gradient-to-r from-pink-500 to-[#6C5CE7] text-white' : 'bg-white/5 hover:bg-pink-500 text-gray-300'}`}>{m}</button>})}</div>)}
                  </div>
                  <div className="relative ml-1">
                    <button onClick={()=>{setShowAmPmList(!showAmPmList); setShowHourList(false); setShowMinList(false); setShowDurList(false);}} className="bg-[#6C5CE7] rounded-lg px-2.5 py-1 font-black text-[11px] shadow-[0_0_15px_#6C5CE7] hover:scale-125 hover:bg-pink-500 transition-all duration-300 transform-gpu">{ampm}</button>
                    {showAmPmList && (<div className="absolute top-[115%] left-0 bg-[#0A0C1A] border border-[#6C5CE7]/50 rounded-xl p-1 w-[60px] z-[60] shadow-[0_20px_40px_rgba(0,0,0,0.8)] grid gap-1">{["AM","PM"].map(a=>{const isActive = a===ampm; return <button key={a} onClick={()=>{setAmPm(a); setShowAmPmList(false);}} className={`px-2 py-2 rounded-lg text-[11px] font-black hover:scale-110 ${isActive? 'bg-[#6C5CE7] text-white' : 'bg-white/10 hover:bg-pink-500 text-gray-300'}`}>{a}</button>})}</div>)}
                  </div>
                </div>
                <div className="relative w-[40%]">
                  <button onClick={()=>{setShowDurList(!showDurList); setShowHourList(false); setShowMinList(false); setShowAmPmList(false);}} className="w-full bg-gradient-to-br from-[#1E213A] to-[#121424] border border-white/10 font-bold text-[11px] px-3 py-2 rounded-xl hover:scale-105 hover:border-[#6C5CE7] transition-all duration-300 transform-gpu">{dur}</button>
                  {showDurList && (<div className="absolute top-[115%] right-0 bg-[#0A0C1A] border border-[#6C5CE7]/50 rounded-2xl p-2 w-[120px] z-[60] shadow-[0_20px_40px_rgba(0,0,0,0.8)] grid gap-1">{DURATIONS.map(d=>{const isActive = d===dur; return <button key={d} onClick={()=>{setDur(d); setShowDurList(false);}} className={`text-left px-3 py-2 rounded-xl text-[11px] font-bold hover:scale-[1.08] ${isActive? 'bg-gradient-to-r from-[#6C5CE7] to-[#EC4899] text-white' : 'bg-white/5 hover:bg-[#6C5CE7] text-gray-300'}`}>{d}</button>})}</div>)}
                </div>
              </div>
              <button onClick={addTask} className="w-full py-3 bg-[#6C5CE7] rounded-xl font-bold hover:scale-[1.05] transition-all">Add Task + Reminder</button>
              {(showHourList || showMinList || showAmPmList || showDurList) && <div className="fixed inset-0 z-5" onClick={()=>{setShowHourList(false); setShowMinList(false); setShowAmPmList(false); setShowDurList(false);}}></div>}
            </div>
            )}
            {!showAddBox && <p className="text-[11px] text-gray-500 mt-2">+ icon par click karo</p>}
          </div>
          <div className="bg-[#121424] p-5 rounded-2xl border border-white/5">
            <h2 className="font-bold mb-1">⏰ Focus Clock</h2>
            <p className="text-xs text-gray-400 mb-3">{currentFocusTask? `Focusing: ${currentFocusTask.subject}` : "Click time to edit"}</p>
            <div className="bg-black/50 rounded-xl p-4 text-center border border-white/10 mb-4">
              {isEditing? (<div className="flex gap-2 justify-center items-center"><input autoFocus type="number" value={editVal} onChange={e=>setEditVal(e.target.value)} className="w-20 bg-black p-2 rounded-lg border border-orange-500 text-center text-2xl font-black" /><button onClick={saveDirectEdit} className="px-3 py-2 bg-orange-500 rounded-lg font-bold">OK</button></div>) : (<div onClick={()=>{setEditVal(String(Math.floor(pomodoroTime/60))); setIsEditing(true);}} className="text-5xl font-black tracking-widest tabular-nums cursor-pointer hover:text-orange-400 transition-all">{formatTime(pomodoroTime)}</div>)}
              <div className="flex justify-center gap-2 mt-4"><button onClick={()=>adjustTime(-1)} className="px-4 py-1.5 bg-white/10 rounded-full text-sm font-bold hover:bg-orange-500">-1m</button><button onClick={()=>{setIsRunning(!isRunning); if(!isRunning) requestWakeLock();}} className="px-6 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full text-sm font-bold">{isRunning? 'Pause':'Start'}</button><button onClick={()=>adjustTime(1)} className="px-4 py-1.5 bg-white/10 rounded-full text-sm font-bold hover:bg-orange-500">+1m</button></div>
              <button onClick={()=>{setPomodoroTime(initialTime); setIsRunning(false);}} className="mt-3 text-xs text-gray-400 hover:text-white underline">Reset</button>
            </div>
            <div className="flex gap-2"><input type="number" min="1" max="120" value={customMins} onChange={e=>setCustomMins(e.target.value)} className="w-[60%] bg-black/50 p-2.5 rounded-lg border border-white/10 text-center font-bold text-lg outline-none" /><button onClick={applyCustomTime} className="w-[40%] bg-white text-black font-bold rounded-lg">Set Mins</button></div>
          </div>
        </div>
        <div className="lg:col-span-6 bg-[#121424] p-5 rounded-2xl border border-white/5 min-h-[500px]">
          <h2 className="font-bold text-xl mb-1">Study Schedule - {selectedDate.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'})}</h2><p className="text-sm text-gray-400 mb-5">{filteredTasks.length} tasks • {progressPct}% done</p>
          <div className="space-y-3">{filteredTasks.map(t=>{const isRinging = ringingTaskId === t.id; return (<div key={t.id} className={`p-4 rounded-xl flex justify-between items-center border-l-4 bg-black/30 ${t.status==='completed'? 'border-green-500 opacity-60' : isRinging? 'border-green-400 bg-green-500/20 scale-[1.04] shadow-[0_0_30px_rgba(34,197,94,0.6)] animate-shake' : 'border-[#6C5CE7]'}`}><div><p className="font-bold">{t.subject} {t.notified && <span className="text-[10px] bg-green-500 px-2 py-0.5 rounded-full ml-2">REMINDED</span>} {isRinging && <span className="text-[10px] bg-red-500 animate-pulse px-2 py-0.5 rounded-full ml-2">⏰ NOW!</span>}</p><p className="text-sm text-gray-400">{t.time} • {t.duration}</p></div><div className="flex gap-2 flex-wrap justify-end">{t.status!=='completed' && <button onClick={()=>completeTask(t)} className="px-3 py-1 bg-green-500 text-black rounded-full text-xs font-bold">✓ Complete</button>}<button onClick={()=>startFocusMode(t)} className="px-3 py-1 bg-[#FFF8E7] text-black rounded-full text-xs font-bold">🍦 Focus Tab</button><button onClick={()=>startFocusingTask(t)} className="px-3 py-1 bg-gradient-to-r from-[#6C5CE7] to-[#A855F7] rounded-full text-xs font-bold">▶ Focus</button><button onClick={()=>deleteTask(t.id)} className="px-3 py-1 bg-white/10 rounded-full text-xs">🗑</button></div></div>)})}</div>
        </div>
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#121424] p-5 rounded-2xl border border-white/5 h-fit relative">
            <div className="flex justify-between items-center mb-4 gap-1"><button onClick={()=>changeYear(-1)} className="px-2.5 py-1.5 bg-white/10 rounded-full">«</button><button onClick={()=>changeMonth(-1)} className="px-3 py-1.5 bg-white/10 rounded-full">‹</button><div className="flex gap-1 relative"><div className="relative"><button onClick={()=>{setShowMonthList(!showMonthList); setShowYearList(false);}} className="bg-gradient-to-br from-[#1E213A] to-[#121424] border border-[#6C5CE7]/50 font-black text-[13px] px-3 py-2 rounded-xl">{MONTHS[viewDate.getMonth()].slice(0,3)}</button>{showMonthList && (<div className="absolute top-[110%] left-0 bg-[#0A0C1A] border border-[#6C5CE7]/50 rounded-2xl p-2 w-[150px] z-50 grid grid-cols-1 gap-1 max-h-[220px] overflow-y-auto">{MONTHS.map((m,i)=>{const isActive = i===viewDate.getMonth(); return <button key={m} onClick={()=>{const d=new Date(viewDate); d.setMonth(i); setViewDate(d); setShowMonthList(false);}} className={`text-left px-3 py-2 rounded-xl text-[12px] font-bold ${isActive? 'bg-gradient-to-r from-[#6C5CE7] to-[#EC4899] text-white' : 'bg-white/5 hover:bg-[#6C5CE7] text-gray-300'}`}>{m}</button>})}</div>)}</div><div className="relative"><button onClick={()=>{setShowYearList(!showYearList); setShowMonthList(false);}} className="bg-gradient-to-br from-[#1E213A] to-[#121424] border border-pink-500/40 font-black text-[13px] px-3 py-2 rounded-xl ml-1">{viewDate.getFullYear()}</button>{showYearList && (<div className="absolute top-[110%] right-0 bg-[#0A0C1A] border border-pink-500/50 rounded-2xl p-2 w-[110px] z-50 grid grid-cols-2 gap-1 max-h-[220px] overflow-y-auto">{Array.from({length: 10}, (_,i)=> 2026 + i).map(y=>{const isActive = y===viewDate.getFullYear(); return <button key={y} onClick={()=>{const d=new Date(viewDate); d.setFullYear(y); setViewDate(d); setShowYearList(false);}} className={`px-2 py-2 rounded-xl text-[12px] font-black ${isActive? 'bg-gradient-to-r from-pink-500 to-[#6C5CE7] text-white' : 'bg-white/5 hover:bg-pink-500 text-gray-300'}`}>{y}</button>})}</div>)}</div></div><button onClick={()=>changeMonth(1)} className="px-3 py-1.5 bg-white/10 rounded-full">›</button><button onClick={()=>changeYear(1)} className="px-2.5 py-1.5 bg-white/10 rounded-full">»</button></div>
            {(showMonthList || showYearList) && <div className="fixed inset-0 z-30" onClick={()=>{setShowMonthList(false); setShowYearList(false);}}></div>}
            <div className="grid grid-cols-7 gap-1.5 text-[13px] text-center relative z-10">{Array.from({length: new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()}, (_,i)=><div key={'e'+i}></div>)}{Array.from({length: new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 0).getDate()},(_,i)=>{const day = i+1; const dObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), day); const isSel = dObj.toDateString() === selectedDateStr; const hasTasks = tasks.some(t=>t.date === dObj.toDateString()); return <div key={day} onClick={()=>setSelectedDate(dObj)} className={`p-2 rounded-lg cursor-pointer font-bold ${isSel? 'bg-[#6C5CE7] text-white scale-110' : 'bg-white/[0.07] hover:bg-pink-500'}`}>{day}{hasTasks &&!isSel && <div className="w-1 h-1 bg-pink-400 rounded-full mx-auto mt-1"></div>}</div>})}</div>
          </div>
          <div className="bg-[#121424] p-5 rounded-[24px] border border-white/5 relative overflow-hidden">
            <div className="flex justify-between items-center mb-3"><h2 className="font-bold text-[13px] tracking-widest text-gray-300">DAILY PROGRESS</h2><span className="text-[10px] bg-[#6C5CE7]/20 border border-[#6C5CE7]/30 px-2 py-0.5 rounded-full font-black text-[#A78BFA]">{completedCount}/{filteredTasks.length}</span></div>
            <div className="relative h-[56px] bg-[#1C1F35]/80 rounded-full border border-white/10 p-2 flex items-center overflow-hidden">{displayProgress < 100? (<><div className="absolute left-5 top-1/2 -translate-y-1/2 z-10"><p className="font-black text-[12px]">Progress</p></div><div className="h-[36px] rounded-full relative overflow-hidden transition-all duration-[1200ms] flex items-center" style={{ width: `${displayProgress}%`, minWidth: displayProgress>0? '40%' : '0%', background: 'linear-gradient(90deg, #22c55e, #86efac, #22c55e, #4ade80)', backgroundSize: '300% 100%', animation: 'liquidFlow 2s ease infinite' }}><div className="absolute inset-0 w-full h-full overflow-hidden"><div className="absolute top-0 left-0 w-[60%] h-full bg-gradient-to-r from-transparent via-white/60 to-transparent" style={{animation: 'glitter 1.2s linear infinite'}}></div></div></div><div className="absolute right-5 top-1/2 -translate-y-1/2 z-10"><p className="font-black text-[13px] text-[#86efac]">{displayProgress}%</p></div></>) : (<div className="w-full h-full flex items-center justify-center"><div className="w-[36px] h-[36px] rounded-full bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center" style={{animation: 'pop 0.6s ease'}}><span className="text-[20px] font-black text-white">✓</span></div><p className="ml-3 font-black text-[12px] text-[#86efac]">COMPLETED!</p></div>)}</div>
            <p className="text-[10px] text-gray-500 mt-3 text-center">{progressPct===100? "🔥 Sab tasks done!" : progressPct>0? `${completedCount} task complete` : "Koi task nahi? Add karo"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}