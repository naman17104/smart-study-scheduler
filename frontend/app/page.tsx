"use client";
import { useState, useEffect, useRef } from "react";
type Task = { id:number; subject:string; time:string; duration:string; status: 'pending' | 'completed' | 'missed', date: string, notified?: boolean };

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
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState("25");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(()=>{
    const now = new Date();
    setSelectedDate(now);
    setViewDate(now);
    const saved = localStorage.getItem("smart_tasks");
    if(saved){ try{ setTasks(JSON.parse(saved)); }catch(e){} }
    if("Notification" in window && Notification.permission === "default"){
      Notification.requestPermission();
    }
  },[]);

  useEffect(()=>{ if(tasks.length>0 || localStorage.getItem("smart_tasks")) localStorage.setItem("smart_tasks", JSON.stringify(tasks)); },[tasks]);

  useEffect(()=>{
    const check = () => {
      const now = new Date();
      const nowDateStr = now.toDateString();
      const nowHour = now.getHours();
      const nowMin = now.getMinutes();
      tasks.forEach(t=>{
        if(t.notified || t.status!== 'pending') return;
        if(t.date!== nowDateStr) return;
        const [timePart, ampmPart] = t.time.split(' ');
        let [h, m] = timePart.split(':').map(Number);
        if(ampmPart === 'PM' && h!== 12) h+=12;
        if(ampmPart === 'AM' && h === 12) h=0;
        if(h === nowHour && m === nowMin){
          setNotif(`⏰ Reminder: ${t.subject} - Abhi ka time hai!`);
          setTimeout(()=>setNotif(null), 6000);
          if("Notification" in window && Notification.permission === "granted"){
            new Notification(`Study Time: ${t.subject}`, { body: `${t.time} - ${t.duration}` });
          }
          try{
            if(audioRef.current){
              audioRef.current.volume = 1.0;
              audioRef.current.currentTime = 0;
              audioRef.current.play();
              setTimeout(()=>{ audioRef.current?.pause(); }, 5000);
            }
          }catch{}
          setTasks(prev => prev.map(x=> x.id===t.id? {...x, notified: true} as any : x));
        }
      });
    };
    const id = setInterval(check, 10000);
    return ()=>clearInterval(id);
  },[tasks]);

  useEffect(() => {
    let interval: any;
    if (isRunning && pomodoroTime > 0) {
      interval = setInterval(() => setPomodoroTime(t => t - 1), 1000);
    } else if (isRunning && pomodoroTime === 0) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 4000);
      if(currentFocusTask){ setTasks(prev => prev.map(x=> x.id===currentFocusTask.id? {...x, status:'completed'} as any : x)); }
      setIsRunning(false); setPomodoroTime(isBreak? initialTime : 5*60); setIsBreak(!isBreak);
    }
    return () => clearInterval(interval);
  }, [isRunning, pomodoroTime, isBreak, initialTime, currentFocusTask]);

  if(!selectedDate ||!viewDate) return <div className="bg-[#050711] min-h-screen flex items-center justify-center text-white">Loading...</div>;

  const selectedDateStr = selectedDate.toDateString();
  const addTask = () => {
    if(!sub) return;
    const finalMin = String(parseInt(timeMin) || 0).padStart(2,'0');
    const finalTime = `${timeHour}:${finalMin} ${ampm}`;
    const newTask: Task = {id: Date.now(), subject:sub, time: finalTime, duration:dur, status:'pending', date: selectedDateStr, notified: false};
    setTasks([...tasks, newTask]); setSub(""); setNotif(`Added: ${sub} at ${finalTime}`); setTimeout(()=>setNotif(null), 3000);
  };

  const startFocusMode = (task: Task) => {
    localStorage.setItem("focus_task", JSON.stringify(task))
    window.open("/focus", "_blank")
  }
  const startFocusingTask = (task: Task) => { setCurrentFocusTask(task); setIsBreak(false); setIsRunning(true); setPomodoroTime(initialTime); };
  const deleteTask = (id:number) => setTasks(tasks.filter(t=>t.id!==id));
  const changeMonth = (delta: number) => setViewDate(prev => { const d = new Date(prev!); d.setMonth(prev!.getMonth()+delta); return d; });
  const changeYear = (delta: number) => setViewDate(prev => { const d = new Date(prev!); d.setFullYear(prev!.getFullYear()+delta); return d; });
  const filteredTasks = tasks.filter(t => t.date === selectedDateStr);
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const formatTime = (sec:number) => { const m = Math.floor(sec/60); const s = sec%60; return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; };
  const adjustTime = (delta:number) => {
    const newTime = Math.min(7200, Math.max(60, pomodoroTime + delta*60));
    setPomodoroTime(newTime); if(!isBreak){ setInitialTime(newTime); }
    setCustomMins(String(Math.floor(newTime/60)));
  };
  const applyCustomTime = () => {
    const m = parseInt(customMins);
    if(!isNaN(m) && m>=1 && m<=120){ setPomodoroTime(m*60); setInitialTime(m*60); setIsRunning(false); setNotif(`Timer set to ${m} mins`); setTimeout(()=>setNotif(null), 2000); }
  };
  const saveDirectEdit = () => {
    const m = parseInt(editVal);
    if(!isNaN(m) && m>=1 && m<=120){ setPomodoroTime(m*60); setInitialTime(m*60); setCustomMins(String(m)); }
    setIsEditing(false);
  };

  return (
    <div className="bg-[#050711] text-white min-h-screen" suppressHydrationWarning>
      <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg" preload="auto" />
      <nav className="flex justify-between items-center p-4 border-b border-white/10 sticky top-0 bg-[#080A14]/80 backdrop-blur-md z-10">
        <h1 className="text-xl font-black">SMART STUDY SCHEDULER <span className="bg-[#6C5CE7] text-xs px-2 py-1 rounded ml-2">PRO</span></h1>
        <div className="flex gap-3">
          <button onClick={()=>{const now=new Date(); setSelectedDate(now); setViewDate(now);}} className="px-5 py-2 bg-white/10 rounded-full hover:bg-white hover:text-black transition-all">Today</button>
          <button onClick={()=>setIsRunning(!isRunning)} className="px-5 py-2 bg-gradient-to-r from-[#6C5CE7] to-[#A855F7] rounded-full font-bold hover:scale-110 hover:shadow-[0_0_25px_#6C5CE7] transition-all">{isRunning? 'Pause':'Start Focus'}</button>
        </div>
      </nav>
      {notif && <div className="fixed top-20 right-5 bg-[#6C5CE7] px-6 py-3 rounded-xl z-50 shadow-[0_0_20px_#6C5CE7] animate-bounce">{notif}</div>}
      {showCelebration && <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]"><div className="bg-gradient-to-br from-[#6C5CE7] to-[#A855F7] p-8 rounded-3xl animate-bounce">🎉 Task Done!</div></div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-[1600px] mx-auto">
        <div className="lg:col-span-3 space-y-6">
          {/* BOX 1: Add For - Purple 3D */}
          <div className="bg-[#121424] p-5 rounded-2xl border border-white/5 transition-all duration-300 transform-gpu hover:-translate-y-2 hover:scale-[1.02] hover:border-[#6C5CE7] hover:shadow-[0_20px_40px_-10px_rgba(108,92,231,0.6)] hover:bg-[#181A2F] group cursor-default">
            <h2 className="font-bold mb-2 group-hover:text-[#6C5CE7] transition-colors">+ Add for</h2>
            <p className="text-xs text-[#6C5CE7] font-bold mb-3">{selectedDate.toLocaleDateString('en-IN', {weekday:'short', day:'numeric', month:'short', year:'numeric'})}</p>
            <input value={sub} onChange={e=>setSub(e.target.value)} placeholder="Subject e.g. Python" className="w-full bg-black/50 p-3 rounded-lg mb-3 border border-white/10 outline-none focus:border-[#6C5CE7] transition-all" />
            <div className="flex gap-2 mb-3">
              <div className="flex gap-1 w-[60%] bg-black/50 p-2 rounded-lg border border-white/10 items-center">
                <select value={timeHour} onChange={e=>setTimeHour(e.target.value)} className="bg-transparent w-[35%] text-center outline-none">{Array.from({length:12},(_,i)=>{const h=i+1; return <option key={h} value={String(h).padStart(2,'0')} className="text-black">{String(h).padStart(2,'0')}</option>})}</select>
                <span>:</span>
                <input type="number" min="0" max="59" value={timeMin} onChange={e=>{ let v=e.target.value; if(v===""){setTimeMin(""); return;} let num=parseInt(v); if(!isNaN(num) && num>=0 && num<=59) setTimeMin(String(num));}} className="bg-transparent w-[35%] text-center outline-none font-bold" placeholder="00" />
                <select value={ampm} onChange={e=>setAmPm(e.target.value)} className="bg-[#6C5CE7] rounded-md px-2 py-1 font-bold ml-1 outline-none"><option>AM</option><option>PM</option></select>
              </div>
              <input value={dur} onChange={e=>setDur(e.target.value)} className="w-[40%] bg-black/50 p-3 rounded-lg border border-white/10" />
            </div>
            <button onClick={addTask} className="w-full py-3 bg-[#6C5CE7] rounded-xl font-bold hover:scale-[1.05] hover:shadow-[0_0_30px_#6C5CE7] active:scale-95 transition-all">Add Task + Reminder</button>
          </div>

          {/* BOX 2: Focus Clock - Orange 3D */}
          <div className="bg-[#121424] p-5 rounded-2xl border border-white/5 transition-all duration-300 transform-gpu hover:-translate-y-2 hover:scale-[1.02] hover:border-orange-500 hover:shadow-[0_20px_40px_-10px_rgba(249,115,22,0.6)] hover:bg-[#1F1A14] group cursor-default">
            <h2 className="font-bold mb-1 group-hover:text-orange-400 transition-colors">⏰ Focus Clock</h2>
            <p className="text-xs text-gray-400 mb-3">{currentFocusTask? `Focusing: ${currentFocusTask.subject}` : "Click time to edit"}</p>
            <div className="bg-black/50 rounded-xl p-4 text-center border border-white/10 mb-4 group-hover:border-orange-500/30 transition-all">
              {isEditing? (
                <div className="flex gap-2 justify-center items-center">
                  <input autoFocus type="number" value={editVal} onChange={e=>setEditVal(e.target.value)} className="w-20 bg-black p-2 rounded-lg border border-orange-500 text-center text-2xl font-black" />
                  <button onClick={saveDirectEdit} className="px-3 py-2 bg-orange-500 rounded-lg font-bold">OK</button>
                </div>
              ) : (
                <div onClick={()=>{setEditVal(String(Math.floor(pomodoroTime/60))); setIsEditing(true);}} className="text-5xl font-black tracking-widest tabular-nums cursor-pointer hover:text-orange-400 hover:scale-110 hover:drop-shadow-[0_0_15px_#F97316] transition-all">{formatTime(pomodoroTime)}</div>
              )}
              <div className="flex justify-center gap-2 mt-4">
                <button onClick={()=>adjustTime(-1)} className="px-4 py-1.5 bg-white/10 rounded-full text-sm font-bold hover:bg-orange-500 hover:scale-125 transition-all">-1m</button>
                <button onClick={()=>setIsRunning(!isRunning)} className="px-6 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full text-sm font-bold hover:scale-125 hover:shadow-[0_0_25px_#F97316] transition-all">{isRunning? 'Pause':'Start'}</button>
                <button onClick={()=>adjustTime(1)} className="px-4 py-1.5 bg-white/10 rounded-full text-sm font-bold hover:bg-orange-500 hover:scale-125 transition-all">+1m</button>
              </div>
              <button onClick={()=>{setPomodoroTime(initialTime); setIsRunning(false);}} className="mt-3 text-xs text-gray-400 hover:text-white underline">Reset</button>
            </div>
            <div className="flex gap-2">
              <input type="number" min="1" max="120" value={customMins} onChange={e=>setCustomMins(e.target.value)} className="w-[60%] bg-black/50 p-2.5 rounded-lg border border-white/10 text-center font-bold text-lg focus:border-orange-500 outline-none" />
              <button onClick={applyCustomTime} className="w-[40%] bg-white text-black font-bold rounded-lg hover:bg-orange-500 hover:text-white hover:scale-110 transition-all">Set Mins</button>
            </div>
          </div>
        </div>

        {/* BOX 3: Study Schedule - Green/Blue 3D */}
        <div className="lg:col-span-6 bg-[#121424] p-5 rounded-2xl border border-white/5 min-h-[500px] transition-all duration-300 transform-gpu hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-[0_20px_50px_-15px_rgba(16,185,129,0.4)] hover:bg-[#141E1B] group">
          <h2 className="font-bold text-xl mb-1 group-hover:text-emerald-400 transition-colors">Study Schedule - {selectedDate.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'})}</h2>
          <p className="text-sm text-gray-400 mb-5">{filteredTasks.length} tasks</p>
          <div className="space-y-3">
            {filteredTasks.map(t=>(
              <div key={t.id} className="p-4 rounded-xl flex justify-between items-center border-l-4 bg-black/30 border-[#6C5CE7] hover:border-emerald-400 hover:bg-black/50 hover:translate-x-2 hover:shadow-[0_10px_20px_rgba(16,185,129,0.2)] transition-all duration-300">
                <div><p className="font-bold">{t.subject} {t.notified && <span className="text-[10px] bg-green-500 px-2 py-0.5 rounded-full ml-2">REMINDED</span>}</p><p className="text-sm text-gray-400">{t.time} • {t.duration}</p></div>
                <div className="flex gap-2">
                  <button onClick={()=>startFocusMode(t)} className="px-3 py-1 bg-[#FFF8E7] text-black rounded-full text-xs font-bold hover:scale-110 active:scale-90 transition-all">🍦 Focus Tab</button>
                  <button onClick={()=>startFocusingTask(t)} className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full text-xs font-bold hover:scale-110 transition-all">▶ Focus</button>
                  <button onClick={()=>deleteTask(t.id)} className="px-3 py-1 bg-white/10 rounded-full text-xs hover:bg-red-600 hover:scale-110 transition-all">🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOX 4: Calendar - Purple/Pink 3D */}
        <div className="lg:col-span-3 bg-[#121424] p-5 rounded-2xl border border-white/5 h-fit transition-all duration-300 transform-gpu hover:-translate-y-2 hover:scale-[1.02] hover:border-pink-500/50 hover:shadow-[0_20px_40px_-10px_rgba(236,72,153,0.5)] hover:bg-[#1E1420] group">
          <div className="flex justify-between items-center mb-4 gap-1">
            <button onClick={()=>changeYear(-1)} className="px-2.5 py-1.5 bg-white/10 rounded-full hover:bg-pink-500 hover:scale-125 transition-all">«</button>
            <button onClick={()=>changeMonth(-1)} className="px-3 py-1.5 bg-white/10 rounded-full hover:bg-pink-500 hover:scale-125 transition-all">‹</button>
            <div className="text-center flex gap-1">
              <select value={viewDate.getMonth()} onChange={e=>{const d=new Date(viewDate); d.setMonth(parseInt(e.target.value)); setViewDate(d);}} className="bg-[#1E213A] border border-pink-500/30 font-bold text-sm px-2 py-1.5 rounded-lg">{months.map((m,i)=><option key={m} value={i} className="bg-white text-black">{m}</option>)}</select>
              <select value={viewDate.getFullYear()} onChange={e=>{const d=new Date(viewDate); d.setFullYear(parseInt(e.target.value)); setViewDate(d);}} className="bg-[#1E213A] border border-pink-500/30 font-bold text-sm px-2 py-1.5 rounded-lg ml-1">{Array.from({length: 10}, (_,i)=> new Date().getFullYear()-2 + i).map(y=><option key={y} value={y} className="bg-white text-black">{y}</option>)}</select>
            </div>
            <button onClick={()=>changeMonth(1)} className="px-3 py-1.5 bg-white/10 rounded-full hover:bg-pink-500 hover:scale-125 transition-all">›</button>
            <button onClick={()=>changeYear(1)} className="px-2.5 py-1.5 bg-white/10 rounded-full hover:bg-pink-500 hover:scale-125 transition-all">»</button>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-[13px] text-center">
            {Array.from({length: new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()}, (_,i)=><div key={'e'+i}></div>)}
            {Array.from({length: new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 0).getDate()},(_,i)=>{
              const day = i+1; const dObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
              const isSel = dObj.toDateString() === selectedDateStr;
              const hasTasks = tasks.some(t=>t.date === dObj.toDateString());
              return <div key={day} onClick={()=>setSelectedDate(dObj)} className={`p-2 rounded-lg cursor-pointer font-bold transition-all duration-200 hover:scale-125 hover:-translate-y-1 ${isSel? 'bg-[#6C5CE7] text-white scale-110 shadow-[0_0_20px_#6C5CE7]' : 'bg-white/[0.07] hover:bg-pink-500 hover:text-white hover:shadow-[0_5px_15px_#EC4899]'}`}>{day}{hasTasks &&!isSel && <div className="w-1 h-1 bg-pink-400 rounded-full mx-auto mt-1"></div>}</div>
            })}
          </div>
        </div>
      </div>
    </div>
  );
}