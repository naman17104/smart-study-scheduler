"use client";
import { useState, useEffect, useRef } from "react";

type Task = {
  id: number;
  subject: string;
  time: string;
  duration: string;
  status: 'pending' | 'completed';
  date: string;
  notified?: boolean
};

const QUOTES = [
  "Boom! Ek aur jeet!",
  "Great job! Consistency is success",
  "Wah! Kar dikhaya",
  "Ek kadam aur",
  "Shabash! Focus ka result"
];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const DURATIONS = ["30 mins","1 hour","2 hours","3 hours","4 hours","5 hours"];

const HOURS_LIST = Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0'));
const MINS_LIST = Array.from({length:60},(_,i)=>String(i).padStart(2,'0'));
const YEARS_LIST = Array.from({length:15},(_,i)=>2020+i);

export default function Page(){
  const [tasks,setTasks]=useState<Task[]>([]);
  const [sub,setSub]=useState("");
  const [h,setH]=useState("10");
  const [m,setM]=useState("00");
  const [ap,setAp]=useState("AM");
  const [dur,setDur]=useState("2 hours");
  const [notif,setNotif]=useState<string|null>(null);
  const [selectedDate,setSelectedDate]=useState<Date>(new Date());
  const [viewDate,setViewDate]=useState<Date>(new Date());
  const [pomodoro,setPomodoro]=useState(25*60);
  const [init,setInit]=useState(25*60);
  const [running,setRunning]=useState(false);
  const [isBreak,setIsBreak]=useState(false);
  const [customMins,setCustomMins]=useState("25");
  const [showCeleb,setShowCeleb]=useState(false);
  const [celebText,setCelebText]=useState("");
  const [isEditing,setIsEditing]=useState(false);
  const [editVal,setEditVal]=useState("25");
  const [ringId,setRingId]=useState<number|null>(null);
  const [showAdd,setShowAdd]=useState(true);
  const [openHour,setOpenHour]=useState(false);
  const [openMin,setOpenMin]=useState(false);
  const [openAp,setOpenAp]=useState(false);
  const [openDur,setOpenDur]=useState(false);
  const [openMonth,setOpenMonth]=useState(false);
  const [openYear,setOpenYear]=useState(false);
  const [progress,setProgress]=useState(0);
  const audioRef=useRef<HTMLAudioElement|null>(null);
  const wakeRef=useRef<any>(null);

  useEffect(()=>{
    const s=localStorage.getItem("smart_tasks");
    if(s){
      try{ setTasks(JSON.parse(s)) }catch{}
    }
    if("Notification" in window && Notification.permission==="default"){
      Notification.requestPermission();
    }
  },[]);

  useEffect(()=>{
    localStorage.setItem("smart_tasks",JSON.stringify(tasks))
  },[tasks]);

  useEffect(()=>{
    const f=tasks.filter(x=>x.date===selectedDate.toDateString());
    const c=f.filter(x=>x.status==='completed').length;
    const p=f.length?Math.round(c/f.length*100):0;
    setProgress(p)
  },[tasks,selectedDate]);

  const requestWake=async()=>{
    try{
      if('wakeLock' in navigator){
        wakeRef.current=await (navigator as any).wakeLock.request('screen')
      }
    }catch{}
  };

  useEffect(()=>{
    if(running) requestWake();
    else try{wakeRef.current?.release()}catch{}
  },[running]);

  useEffect(()=>{
    const check=()=>{
      const now=new Date();
      const nowStr=now.toDateString();
      const nh=now.getHours();
      const nm=now.getMinutes();
      tasks.forEach(t=>{
        if(t.notified || t.status!=='pending') return;
        if(t.date!==nowStr) return;
        const [tp,apP]=t.time.split(' ');
        let [hh,mm]=tp.split(':').map(Number);
        if(apP==='PM'&&hh!==12) hh+=12;
        if(apP==='AM'&&hh===12) hh=0;
        if(hh===nh && mm===nm){
          setNotif(`⏰ ${t.subject} - Time ho gaya!`);
          setTimeout(()=>setNotif(null),8000);
          if("vibrate" in navigator) navigator.vibrate([500,200,500]);
          try{
            audioRef.current!.volume=1;
            audioRef.current!.currentTime=0;
            audioRef.current!.play().catch(()=>{});
            setTimeout(()=>audioRef.current?.pause(),8000)
          }catch{}
          setRingId(t.id);
          setTimeout(()=>setRingId(null),8000);
          setTasks(p=>p.map(x=>x.id===t.id?{...x,notified:true}:x));
        }
      })
    };
    const id=setInterval(check,5000);
    return ()=>clearInterval(id);
  },[tasks]);

  useEffect(()=>{
    let id:any;
    if(running && pomodoro>0){
      id=setInterval(()=>setPomodoro(v=>v-1),1000);
    } else if(running && pomodoro===0){
      setCelebText(QUOTES[Math.floor(Math.random()*QUOTES.length)]);
      setShowCeleb(true);
      setTimeout(()=>setShowCeleb(false),3500);
      setRunning(false);
      setPomodoro(isBreak?init:5*60);
      setIsBreak(!isBreak);
    }
    return ()=>clearInterval(id);
  },[running,pomodoro,isBreak,init]);

  const selectedStr=selectedDate.toDateString();
  const filtered=tasks.filter(t=>t.date===selectedStr);
  const done=filtered.filter(t=>t.status==='completed').length;

  const addTask=()=>{
    if(!sub.trim()){
      setNotif("Pehle task likh bhai!");
      setTimeout(()=>setNotif(null),2000);
      return;
    }
    const finalTime=`${h}:${String(parseInt(m)||0).padStart(2,'0')} ${ap}`;
    const nt:Task={
      id:Date.now(),
      subject:sub.trim(),
      time:finalTime,
      duration:dur,
      status:'pending',
      date:selectedStr,
      notified:false
    };
    setTasks([...tasks,nt]);
    setSub("");
    setNotif(`Added: ${nt.subject}`);
    setTimeout(()=>setNotif(null),2500);
  };

  const fmt=(s:number)=>{
    const mm=Math.floor(s/60);
    const ss=s%60;
    return `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  };

  const adjust=(d:number)=>{
    const nt=Math.min(7200,Math.max(60,pomodoro+d*60));
    setPomodoro(nt);
    if(!isBreak) setInit(nt);
    setCustomMins(String(Math.floor(nt/60)))
  };

  const saveEdit=()=>{
    const v=parseInt(editVal);
    if(v>=1&&v<=120){
      setPomodoro(v*60);
      setInit(v*60);
    }
    setIsEditing(false);
  };

  const saveCustom=()=>{
    const v=parseInt(customMins);
    if(v>=1&&v<=120){
      setPomodoro(v*60);
      setInit(v*60);
      setRunning(false);
    }
  };

  const handleEnterAdd=(e:any)=>{
    if(e.key==='Enter') addTask();
  };

  const handleEnterEdit=(e:any)=>{
    if(e.key==='Enter') saveEdit();
  };

  const handleEnterCustom=(e:any)=>{
    if(e.key==='Enter') saveCustom();
  };

  return(
    <div className="bg-[#050711] text-white min-h-screen">
      <style>{`
      .card-3d{transition:all.35s cubic-bezier(.175,.885,.32,1.275)}
      .card-3d:hover{transform:translateY(-5px) scale(1.015); box-shadow:0 15px 35px rgba(108,92,231,.25); border-color:rgba(108,92,231,.5)!important}
      .btn-3d{transition:all.25s ease}.btn-3d:hover{transform:scale(1.08)}.btn-3d:active{transform:scale(.92)}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}.shake{animation:shake.3s infinite}
      `}</style>
      <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg" preload="auto" />
      <nav className="flex justify-between items-center p-4 border-b border-white/10 sticky top-0 bg-[#080A14]/90 backdrop-blur z-20">
        <h1 className="font-black text-xl">SMART STUDY SCHEDULER <span className="bg-[#6C5CE7] text-xs px-2 py-1 rounded ml-2">PRO</span></h1>
        <div className="flex gap-2">
          <button type="button" onClick={()=>{const n=new Date(); setSelectedDate(n); setViewDate(n)}} className="px-4 py-2 bg-white/10 rounded-full btn-3d">Today</button>
          <button type="button" onClick={()=>setRunning(!running)} className="px-4 py-2 bg-[#6C5CE7] rounded-full font-bold btn-3d">{running?'Pause':'Start Focus'}</button>
        </div>
      </nav>
      {notif && <div className="fixed top-20 right-4 bg-[#6C5CE7] px-5 py-3 rounded-xl z-50 animate-bounce">{notif}</div>}
      {showCeleb && <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99]"><div className="bg-[#121424] p-8 rounded-3xl text-center border border-[#6C5CE7]"><div className="text-5xl mb-2">🎉</div><h2 className="text-2xl font-black">Congratulations!</h2><p className="text-[#FFE082] mt-2">{celebText}</p></div></div>}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 max-w-[1600px] mx-auto">
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-[#121424] p-5 rounded-2xl border border-white/5 card-3d">
            <div className="flex items-center gap-3 mb-2">
              <button type="button" onClick={()=>setShowAdd(!showAdd)} className={`w-9 h-9 rounded-full text-2xl font-black btn-3d ${showAdd?'bg-green-500 rotate-45':'bg-[#6C5CE7]'}`}>+</button>
              <h2 className="font-bold">Add Task</h2>
            </div>
            <p className="text-xs text-[#6C5CE7] font-bold mb-3">{selectedDate.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</p>
            {showAdd && <>
              <input value={sub} onChange={e=>setSub(e.target.value)} onKeyDown={handleEnterAdd} placeholder="What would you like to do?" className="w-full bg-black/50 p-3 rounded-xl border border-white/10 outline-none focus:border-[#6C5CE7] mb-3" />
              <div className="flex gap-2 mb-3">
                <div className="flex gap-1 bg-black/30 p-1.5 rounded-xl border border-white/10 items-center w-[60%]">
                  <div className="relative">
                    <button type="button" onClick={()=>{setOpenHour(!openHour); setOpenMin(false); setOpenAp(false); setOpenDur(false)}} className="bg-[#1E213A] px-2.5 py-1.5 rounded-lg text-xs font-black border border-[#6C5CE7]/50 btn-3d">{h}</button>
                    {openHour && <div className="absolute top-9 left-0 bg-[#0A0C1A] border border-white/10 rounded-xl p-1 w-16 max-h-40 overflow-auto z-50 grid gap-1">{HOURS_LIST.map(v=><button type="button" key={v} onClick={()=>{setH(v); setOpenHour(false)}} className="py-1.5 bg-white/5 hover:bg-[#6C5CE7] rounded-lg text-xs font-bold">{v}</button>)}</div>}
                  </div>
                  <span className="font-black text-[#6C5CE7]">:</span>
                  <div className="relative">
                    <button type="button" onClick={()=>{setOpenMin(!openMin); setOpenHour(false); setOpenAp(false); setOpenDur(false)}} className="bg-[#1E213A] px-2.5 py-1.5 rounded-lg text-xs font-black border border-pink-500/30 btn-3d">{m}</button>
                    {openMin && <div className="absolute top-9 left-0 bg-[#0A0C1A] border border-white/10 rounded-xl p-1 w-16 max-h-40 overflow-auto z-50 grid gap-1">{MINS_LIST.map(v=><button type="button" key={v} onClick={()=>{setM(v); setOpenMin(false)}} className="py-1 bg-white/5 hover:bg-pink-500 rounded-lg text-[11px] font-bold">{v}</button>)}</div>}
                  </div>
                  <div className="relative ml-1">
                    <button type="button" onClick={()=>{setOpenAp(!openAp); setOpenHour(false); setOpenMin(false); setOpenDur(false)}} className="bg-[#6C5CE7] px-2 py-1 rounded-lg text-[11px] font-black btn-3d">{ap}</button>
                    {openAp && <div className="absolute top-9 left-0 bg-[#0A0C1A] border border-white/10 rounded-xl p-1 w-14 z-50 grid gap-1">{["AM","PM"].map(v=><button type="button" key={v} onClick={()=>{setAp(v); setOpenAp(false)}} className="py-1.5 bg-white/5 hover:bg-[#6C5CE7] rounded-lg text-xs font-bold">{v}</button>)}</div>}
                  </div>
                </div>
                <div className="relative w-[40%]">
                  <button type="button" onClick={()=>{setOpenDur(!openDur); setOpenHour(false); setOpenMin(false); setOpenAp(false)}} className="w-full bg-[#1E213A] border border-white/10 rounded-xl py-2 text-xs font-bold btn-3d">{dur}</button>
                  {openDur && <div className="absolute top-10 right-0 bg-[#0A0C1A] border border-white/10 rounded-xl p-1 w-28 z-50 grid gap-1">{DURATIONS.map(v=><button type="button" key={v} onClick={()=>{setDur(v); setOpenDur(false)}} className="text-left px-2 py-1.5 bg-white/5 hover:bg-[#6C5CE7] rounded-lg text-xs font-bold">{v}</button>)}</div>}
                </div>
              </div>
              <button type="button" onClick={addTask} className="w-full py-3 bg-[#6C5CE7] hover:bg-[#7d6ef0] rounded-xl font-bold btn-3d">Add Task + Reminder</button>
            </>}
          </div>
          <div className="bg-[#121424] p-5 rounded-2xl border border-white/5 card-3d">
            <h2 className="font-bold mb-1">⏰ Focus Clock</h2>
            <p className="text-xs text-gray-400 mb-3">Click time to edit</p>
            <div className="bg-black/50 rounded-xl p-4 text-center border border-white/10 mb-3">
              {isEditing? (
                <div className="flex gap-2 justify-center">
                  <input autoFocus type="number" value={editVal} onChange={e=>setEditVal(e.target.value)} onKeyDown={handleEnterEdit} className="w-20 bg-black border border-orange-500 rounded-lg text-center text-2xl font-black p-1" />
                  <button type="button" onClick={saveEdit} className="px-3 bg-orange-500 rounded-lg font-bold btn-3d">OK</button>
                </div>
              ) : (
                <div onClick={()=>{setEditVal(String(Math.floor(pomodoro/60))); setIsEditing(true)}} className="text-5xl font-black tracking-widest cursor-pointer hover:text-orange-400">{fmt(pomodoro)}</div>
              )}
              <div className="flex justify-center gap-2 mt-4">
                <button type="button" onClick={()=>adjust(-1)} className="px-3 py-1.5 bg-white/10 rounded-full text-xs font-bold btn-3d">-1m</button>
                <button type="button" onClick={()=>setRunning(!running)} className="px-5 py-1.5 bg-orange-500 rounded-full text-xs font-bold btn-3d">{running?'Pause':'Start'}</button>
                <button type="button" onClick={()=>adjust(1)} className="px-3 py-1.5 bg-white/10 rounded-full text-xs font-bold btn-3d">+1m</button>
              </div>
            </div>
            <div className="flex gap-2">
              <input type="number" value={customMins} onChange={e=>setCustomMins(e.target.value)} onKeyDown={handleEnterCustom} className="w-[60%] bg-black/50 p-2.5 rounded-lg border border-white/10 text-center font-bold" />
              <button type="button" onClick={saveCustom} className="w-[40%] bg-white text-black font-bold rounded-lg btn-3d">Set Mins</button>
            </div>
          </div>
        </div>
        <div className="lg:col-span-6 bg-[#121424] p-5 rounded-2xl border border-white/5 min-h-[500px] card-3d">
          <h2 className="font-bold text-lg">Study Schedule - {selectedDate.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</h2>
          <p className="text-sm text-gray-400 mb-4">{filtered.length} tasks • {progress}% done</p>
          <div className="space-y-3">
            {filtered.length===0 && <p className="text-center text-gray-500 mt-20">No tasks. Add from left.</p>}
            {filtered.map(t=><div key={t.id} className={`p-4 rounded-xl flex justify-between items-center border-l-4 bg-black/30 ${t.status==='completed'?'border-green-500 opacity-60':ringId===t.id?'border-green-400 bg-green-500/20 shake':'border-[#6C5CE7]'}`}><div><p className="font-bold">{t.subject} {ringId===t.id&&<span className="ml-2 text-[10px] bg-red-500 px-2 py-0.5 rounded-full animate-pulse">NOW!</span>}</p><p className="text-xs text-gray-400">{t.time} • {t.duration}</p></div><div className="flex gap-2"><button type="button" onClick={()=>{setTasks(p=>p.map(x=>x.id===t.id?{...x,status:'completed'}:x)); setCelebText(QUOTES[0]); setShowCeleb(true); setTimeout(()=>setShowCeleb(false),3000)}} className="px-3 py-1 bg-green-500 text-black rounded-full text-xs font-bold btn-3d">✓</button><button type="button" onClick={()=>setTasks(p=>p.filter(x=>x.id!==t.id))} className="px-3 py-1 bg-white/10 rounded-full text-xs btn-3d">🗑</button></div></div>)}
          </div>
        </div>
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-[#121424] p-5 rounded-2xl border border-white/5 card-3d relative">
            <div className="flex justify-between items-center mb-4">
              <button type="button" onClick={()=>setViewDate(d=>{const nd=new Date(d); nd.setFullYear(d.getFullYear()-1); return nd})} className="px-2 py-1 bg-white/10 rounded-full btn-3d">«</button>
              <button type="button" onClick={()=>setViewDate(d=>{const nd=new Date(d); nd.setMonth(d.getMonth()-1); return nd})} className="px-2 py-1 bg-white/10 rounded-full btn-3d">‹</button>
              <div className="flex gap-1">
                <div className="relative"><button type="button" onClick={()=>{setOpenMonth(!openMonth); setOpenYear(false)}} className="px-3 py-1.5 bg-[#1E213A] border border-[#6C5CE7]/50 rounded-xl text-xs font-black btn-3d">{MONTHS[viewDate.getMonth()].slice(0,3)}</button>{openMonth && <div className="absolute top-9 left-0 bg-[#0A0C1A] border border-white/10 rounded-xl p-1 w-32 max-h-48 overflow-auto z-50 grid gap-1">{MONTHS.map((mm,i)=><button type="button" key={mm} onClick={()=>{const nd=new Date(viewDate); nd.setMonth(i); setViewDate(nd); setOpenMonth(false)}} className="text-left px-2 py-1.5 bg-white/5 hover:bg-[#6C5CE7] rounded-lg text-xs font-bold">{mm}</button>)}</div>}</div>
                <div className="relative"><button type="button" onClick={()=>{setOpenYear(!openYear); setOpenMonth(false)}} className="px-3 py-1.5 bg-[#1E213A] border border-pink-500/30 rounded-xl text-xs font-black btn-3d">{viewDate.getFullYear()}</button>{openYear && <div className="absolute top-9 right-0 bg-[#0A0C1A] border border-white/10 rounded-xl p-1 w-20 max-h-48 overflow-auto z-50 grid grid-cols-1 gap-1">{YEARS_LIST.map(y=><button type="button" key={y} onClick={()=>{const nd=new Date(viewDate); nd.setFullYear(y); setViewDate(nd); setOpenYear(false)}} className="py-1.5 bg-white/5 hover:bg-pink-500 rounded-lg text-xs font-bold">{y}</button>)}</div>}</div>
              </div>
              <button type="button" onClick={()=>setViewDate(d=>{const nd=new Date(d); nd.setMonth(d.getMonth()+1); return nd})} className="px-2 py-1 bg-white/10 rounded-full btn-3d">›</button>
              <button type="button" onClick={()=>setViewDate(d=>{const nd=new Date(d); nd.setFullYear(d.getFullYear()+1); return nd})} className="px-2 py-1 bg-white/10 rounded-full btn-3d">»</button>
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center text-sm">
              {Array.from({length:new Date(viewDate.getFullYear(),viewDate.getMonth(),1).getDay()},(_,i)=><div key={'e'+i}></div>)}
              {Array.from({length:new Date(viewDate.getFullYear(),viewDate.getMonth()+1,0).getDate()},(_,i)=>{const day=i+1; const dObj=new Date(viewDate.getFullYear(),viewDate.getMonth(),day); const isSel=dObj.toDateString()===selectedStr; return <div key={day} onClick={()=>setSelectedDate(dObj)} className={`p-2 rounded-lg cursor-pointer font-bold btn-3d ${isSel?'bg-[#6C5CE7] scale-110 shadow-[0_0_12px_#6C5CE7]':'bg-white/5 hover:bg-pink-500'}`}>{day}</div>})}
            </div>
          </div>
          <div className="bg-[#121424] p-5 rounded-2xl border border-white/5 card-3d">
            <h2 className="font-bold text-xs tracking-widest mb-3">DAILY PROGRESS {done}/{filtered.length}</h2>
            <div className="h-10 bg-[#1C1F35] rounded-full p-1.5 flex items-center"><div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-700" style={{width:`${progress}%`}}></div><span className="ml-auto mr-3 text-xs font-black">{progress}%</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}