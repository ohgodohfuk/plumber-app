"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useLiveQuery } from "dexie-react-hooks"
import { db, seedDatabase, Job } from "@/lib/db"
import { supabase } from "@/lib/supabase" // <--- DIRECT CLOUD LINK
import { useTacticalFeedback } from "@/hooks/use-tactical-feedback"
import { 
  Navigation, 
  MapPin, 
  CheckCircle2, 
  X, 
  RotateCcw, 
  ChevronRight, 
  AlertCircle, 
  Mic, 
  Battery, 
  Signal, 
  ArrowLeft, 
  Square, 
  Save, 
  UserCircle2, 
  Power, 
  Loader2, 
  WifiOff 
} from "lucide-react"

// --- TYPES ---
type WorkflowStep = "idle" | "traveling" | "arrived" | "debrief" | "complete"

// --- MOCK USERS FOR LOGIN ---
const USERS = [
    { name: "Mason, J.", id: "247" },
    { name: "Connor, S.", id: "104" },
    { name: "Ripley, E.", id: "303" }
]

// --- COMPONENT: LOGIN SCREEN ---
function LoginScreen({ onLogin }: { onLogin: (name: string) => void }) {
    const { trigger } = useTacticalFeedback()

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 scanlines font-mono">
            <div className="mb-12 text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/50 animate-pulse">
                    <UserCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-black text-foreground uppercase tracking-widest mb-2">Identify</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Select active field unit</p>
            </div>

            <div className="w-full max-w-sm space-y-3">
                {USERS.map(user => (
                    <button
                        key={user.id}
                        onClick={() => {
                            trigger("click")
                            onLogin(user.name)
                        }}
                        className="w-full h-16 bg-card border border-border hover:border-primary hover:bg-primary/5 text-left px-6 rounded-xl group transition-all panel-bevel active:scale-[0.98]"
                    >
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{user.name}</span>
                            <span className="text-[10px] font-black bg-muted/50 px-2 py-1 rounded text-muted-foreground group-hover:text-primary">UNIT {user.id}</span>
                        </div>
                    </button>
                ))}
            </div>
            
            <div className="mt-12 text-center opacity-30">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">IronClad Field Ops v1.0</p>
            </div>
        </div>
    )
}

// --- COMPONENT: DEBRIEF MODAL (HYBRID ENGINE) ---
function DebriefModal({ onCancel, onSubmit }: { onCancel: () => void, onSubmit: (notes: string) => void }) {
    const { trigger } = useTacticalFeedback()
    const [isRecording, setIsRecording] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [useOfflineMode, setUseOfflineMode] = useState(false)
    const [notes, setNotes] = useState("")
    
    // 1. High-End API Refs (Online)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])

    // 2. Browser Native Refs (Offline Fallback)
    const recognitionRef = useRef<any>(null)

    // INITIALIZE BROWSER ENGINE
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition()
                recognition.continuous = true
                recognition.interimResults = true
                recognition.lang = 'en-US'
                
                recognition.onresult = (event: any) => {
                    let transcript = ''
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        if (event.results[i].isFinal) {
                            transcript += event.results[i][0].transcript + ' '
                        }
                    }
                    if (transcript) {
                        setNotes(prev => (prev + transcript).trim() + " ")
                    }
                }
                recognitionRef.current = recognition
            }
        }
    }, [])

    // --- START LOGIC ---
    const startRecording = async () => {
        trigger("start")
        const isOnline = navigator.onLine
        setUseOfflineMode(!isOnline)

        if (isOnline) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                mediaRecorderRef.current = new MediaRecorder(stream)
                chunksRef.current = [] 

                mediaRecorderRef.current.ondataavailable = (e) => {
                    if (e.data.size > 0) chunksRef.current.push(e.data)
                }

                mediaRecorderRef.current.start()
                setIsRecording(true)
            } catch (err) {
                trigger("error")
                console.error("Mic Error:", err)
                alert("Microphone access denied.")
            }
        } else {
            if (!recognitionRef.current) {
                trigger("error")
                alert("Offline voice input not supported in this browser.")
                return
            }
            try {
                recognitionRef.current.start()
                setIsRecording(true)
            } catch (e) {
                console.error("Native Mic Error", e)
            }
        }
    }

    // --- STOP LOGIC ---
    const stopRecording = () => {
        trigger("click")
        setIsRecording(false)

        if (useOfflineMode && recognitionRef.current) {
            recognitionRef.current.stop()
            return
        }

        if (!useOfflineMode && mediaRecorderRef.current) {
            setIsProcessing(true)
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
                const formData = new FormData()
                formData.append("file", audioBlob, "audio.webm")

                try {
                    const response = await fetch("/api/transcribe", {
                        method: "POST",
                        body: formData,
                    })
                    const data = await response.json()
                    
                    if (!response.ok) throw new Error(data.error || "Server Error")
                    if (data.text) {
                        setNotes((prev) => (prev + " " + data.text).trim())
                        trigger("success")
                    }
                } catch (error: any) {
                    trigger("error")
                    console.error("Transcription Failed:", error)
                    alert("Transcription failed. Please type manually.")
                } finally {
                    setIsProcessing(false)
                    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop())
                }
            }
            mediaRecorderRef.current.stop()
        }
    }
    
    return (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex flex-col p-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-8 border-b border-border/50 pb-4">
                <h2 className="text-xl font-black uppercase text-foreground tracking-widest">Mission Debrief</h2>
                <button onClick={onCancel} className="p-2 text-muted-foreground hover:text-foreground"><X className="w-8 h-8" /></button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center gap-8">
                <div 
                    className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer select-none ${
                        isRecording 
                        ? 'bg-destructive/20 border-4 border-destructive shadow-[0_0_50px_var(--color-destructive)] scale-110' 
                        : isProcessing 
                        ? 'bg-action-warning/20 border-4 border-action-warning animate-pulse'
                        : 'bg-secondary border-4 border-border hover:border-primary'
                    }`}
                    onMouseDown={startRecording} 
                    onMouseUp={stopRecording} 
                    onMouseLeave={stopRecording}
                    onTouchStart={(e) => { e.preventDefault(); startRecording() }} 
                    onTouchEnd={(e) => { e.preventDefault(); stopRecording() }}
                >
                    <div className={`absolute inset-0 rounded-full border border-destructive opacity-0 ${isRecording ? 'animate-ping opacity-100' : ''}`} />
                    {isProcessing ? (
                        <Loader2 className="w-16 h-16 text-action-warning animate-spin" />
                    ) : isRecording ? (
                        <Square className="w-16 h-16 text-destructive fill-current" /> 
                    ) : useOfflineMode ? (
                        <WifiOff className="w-16 h-16 text-muted-foreground" />
                    ) : (
                        <Mic className="w-16 h-16 text-foreground" />
                    )}
                </div>

                <div className="text-center space-y-2">
                    <h3 className={`text-2xl font-black uppercase tracking-widest ${
                        isRecording ? 'text-destructive animate-pulse' : 
                        isProcessing ? 'text-action-warning' : 'text-muted-foreground'
                    }`}>
                        {isRecording ? "RECORDING..." : isProcessing ? "UPLOADING..." : "HOLD TO RECORD"}
                    </h3>
                    <p className="text-xs font-mono text-muted-foreground max-w-[200px] mx-auto">
                        {useOfflineMode 
                            ? "Offline Mode: Using simplified basic transcription." 
                            : "Online Mode: AI Enhanced transcription active."}
                    </p>
                </div>
            </div>

            <div className="mt-auto space-y-4">
                 <textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Dictate your job notes here, or type manually if you prefer..."
                    className="w-full bg-card border border-border rounded-xl p-4 min-h-[100px] text-sm font-mono focus:border-primary transition-colors panel-inset placeholder:text-muted-foreground/50" 
                    disabled={isProcessing}
                 />
                 <button 
                    onClick={() => {
                        trigger("success")
                        onSubmit(notes)
                    }} 
                    disabled={isProcessing}
                    className="w-full h-16 bg-action-success text-action-success-foreground rounded-xl font-black text-lg uppercase tracking-wide flex items-center justify-center gap-2 panel-bevel active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    <Save className="w-5 h-5" /> 
                    Submit & Close Job
                 </button>
            </div>
        </div>
    )
}

// --- COMPONENT: ACTIVE JOB VIEW ---
function ActiveJobView({ job, onBack, onComplete }: { job: Job; onBack: () => void; onComplete: (id: string, notes: string) => void }) {
  const { trigger } = useTacticalFeedback()
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("idle")
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showDebrief, setShowDebrief] = useState(false)

  const isUrgent = job.priority === 'high' || job.priority === 'urgent';

  const handleAction = (step: WorkflowStep) => {
    trigger("click")
    if (step === "debrief") setShowDebrief(true)
    else setCurrentStep(step)
  }

  const handleReset = () => {
    trigger("click")
    setCurrentStep("idle")
    setShowResetConfirm(false)
  }

  const handleDebriefSubmit = (notes: string) => {
    setShowDebrief(false)
    onComplete(job.id, notes)
  }

  const isJobInProgress = currentStep !== "idle" && currentStep !== "complete"

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
      {showDebrief && <DebriefModal onCancel={() => setShowDebrief(false)} onSubmit={handleDebriefSubmit} />}
      <header className="w-full bg-card border-b border-border px-4 py-4 panel-bevel flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="w-6 h-6" /></button>
            <div>
                 <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full animate-pulse ${isUrgent ? 'bg-destructive' : 'bg-action-success'}`} />
                    <span className={`text-xs font-bold tracking-wider uppercase ${isUrgent ? 'text-destructive' : 'text-action-success'}`}>Active Job</span>
                </div>
                <span className="text-sm font-bold text-foreground">{job.id}</span>
            </div>
        </div>
        {isJobInProgress && (
          <button onClick={() => setShowResetConfirm(true)} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors px-3 py-2 rounded border border-border/50 bg-background/50">
            <RotateCcw className="w-3.5 h-3.5" /> RESET
          </button>
        )}
      </header>
      {showResetConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-card border border-border rounded-lg p-6 panel-bevel max-w-sm w-full shadow-2xl">
            <h2 className="text-lg font-black text-foreground uppercase mb-2">Reset Protocols?</h2>
            <p className="text-sm text-muted-foreground mb-6">Current progress will be lost.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 h-12 bg-secondary text-secondary-foreground rounded-lg font-bold text-sm uppercase tracking-wide panel-bevel">Cancel</button>
              <button onClick={handleReset} className="flex-1 h-12 bg-destructive text-destructive-foreground rounded-lg font-bold text-sm uppercase tracking-wide panel-bevel">Reset</button>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
        {currentStep === "traveling" ? (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-card border border-border rounded-xl panel-inset overflow-hidden relative min-h-[300px]">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `linear-gradient(to right, var(--color-action-success) 1px, transparent 1px), linear-gradient(to bottom, var(--color-action-success) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-full border-4 border-action-success/30 flex items-center justify-center mb-6 animate-pulse"><Navigation className="w-10 h-10 text-action-success" /></div>
                <h2 className="text-2xl font-black text-foreground mb-1">{job.address}</h2>
                <p className="text-lg text-muted-foreground font-medium">{job.distance} • ETA {job.estTime}</p>
              </div>
            </div>
            <div className="mt-6">
              <button onClick={() => handleAction("arrived")} className="w-full h-24 bg-action-info text-action-info-foreground rounded-xl font-black text-2xl uppercase tracking-wide flex items-center justify-center gap-4 panel-bevel active:scale-[0.98] transition-transform"><MapPin className="w-8 h-8" /> ARRIVED ON SITE</button>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-card border border-border rounded-xl p-5 panel-inset space-y-4">
               <div><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target Location</span><h1 className="text-xl font-black text-foreground mt-1 leading-tight">{job.address}</h1></div>
               <div className="pt-4 border-t border-border/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Critical Issue</span>
                    {isUrgent && <span className="text-[10px] font-black text-destructive uppercase bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20">URGENT PRIORITY</span>}
                  </div>
                  <p className={`text-lg font-bold ${isUrgent ? 'text-destructive' : 'text-foreground'}`}>{job.issue}</p>
               </div>
               <div className="bg-background/40 border border-border/50 rounded-lg p-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Dispatcher Notes</span>
                  <p className="text-sm text-foreground/80 leading-relaxed font-medium">{job.notes}</p>
               </div>
            </div>
            <div className="flex flex-col gap-3 mt-auto pb-4">
              <button onClick={() => handleAction("traveling")} disabled={currentStep !== "idle"} className="w-full h-20 bg-action-warning text-action-warning-foreground rounded-xl font-black text-lg uppercase tracking-wide flex items-center justify-center gap-3 panel-bevel active:scale-[0.98] disabled:opacity-30 disabled:grayscale transition-all"><Navigation className="w-6 h-6" /> Start Travel</button>
              <button onClick={() => handleAction("arrived")} disabled={true} className="w-full h-20 bg-action-info text-action-info-foreground rounded-xl font-black text-lg uppercase tracking-wide flex items-center justify-center gap-3 panel-bevel active:scale-[0.98] disabled:opacity-30 disabled:grayscale transition-all"><MapPin className="w-6 h-6" /> Arrived</button>
              <button onClick={() => handleAction("debrief")} disabled={currentStep !== "arrived"} className="w-full h-20 bg-action-success text-action-success-foreground rounded-xl font-black text-lg uppercase tracking-wide flex items-center justify-center gap-3 panel-bevel active:scale-[0.98] disabled:opacity-30 disabled:grayscale transition-all"><CheckCircle2 className="w-6 h-6" /> Job Complete</button>
            </div>
          </>
        )}
      </div>
      <footer className="w-full bg-card border-t border-border px-6 py-3 panel-bevel">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Operational Status</span>
          <span className="text-xs font-black text-foreground uppercase bg-background/50 px-3 py-1 rounded border border-border/50">
            {currentStep === "idle" && "READY TO DEPLOY"}
            {currentStep === "traveling" && "EN ROUTE"}
            {currentStep === "arrived" && "ON SITE"}
            {currentStep === "complete" && "MISSION COMPLETE"}
          </span>
        </div>
      </footer>
    </div>
  )
}

// --- MAIN PAGE: MANIFEST VIEW ---
export default function FieldApp() {
  const { trigger } = useTacticalFeedback()
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  
  const manifest = useLiveQuery(
    () => currentUser ? db.jobs.where('assignee').equals(currentUser).toArray() : [],
    [currentUser]
  )

  // REMOVED: seedDatabase() to prevent zombie data from reappearing.

  // --- UPDATED COMPLETE HANDLER (INSTANT UPLINK) ---
  const handleJobComplete = async (id: string, notes: string) => {
    if (!manifest) return;

    // 1. FIRE AND FORGET UPLOAD
    supabase.from('jobs').update({ 
        status: 'complete', 
        notes: notes,
        last_updated: Date.now() 
    }).eq('id', id).then(({ error }) => {
        if (error) console.error("Cloud Upload Failed:", error)
        else console.log("✅ Cloud Updated Instantly")
    })

    // 2. UPDATE LOCAL DB
    await db.jobs.update(id, { 
        status: "complete", 
        notes: notes, 
        lastUpdated: Date.now() 
    })
    
    setActiveJobId(null)
  }

  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} />

  if (!manifest) return <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono scanlines text-action-success animate-pulse">CONNECTING...</div>

  const activeJob = manifest.find(j => j.id === activeJobId)

  if (activeJob) {
    return (
      <div className="dark min-h-screen bg-background scanlines font-mono text-foreground">
        <ActiveJobView job={activeJob as any} onBack={() => setActiveJobId(null)} onComplete={handleJobComplete} />
      </div>
    )
  }

  return (
    <div className="dark min-h-screen bg-background flex flex-col scanlines font-mono text-foreground select-none">
      <div className="bg-background/90 backdrop-blur px-6 py-2 flex justify-between items-center text-[10px] font-bold text-muted-foreground border-b border-border/50 sticky top-0 z-50">
        <span>08:42 AM</span>
        <div className="flex gap-3">
          <Link href="/dashboard" className="flex items-center gap-1 hover:text-action-success cursor-pointer transition-colors" title="Open Command Dashboard"><Signal className="w-3 h-3" /> LTE</Link>
          <div className="flex items-center gap-1"><Battery className="w-3 h-3" /> 84%</div>
        </div>
      </div>

      <header className="bg-card border-b border-border px-6 py-6 panel-bevel">
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-action-success animate-pulse shadow-[0_0_10px_var(--color-action-success)]"/>
              <span className="text-xs font-black text-action-success tracking-widest uppercase">System Online</span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Daily Manifest</h1>
          </div>
          <div className="text-right">
             <button onClick={() => setCurrentUser(null)} className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider mb-1 block">
                {currentUser} <Power className="w-3 h-3 inline ml-1"/>
             </button>
            <span className="text-sm font-bold text-foreground">JAN 05</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="flex justify-between items-end px-2 mb-1">
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            Assigned Tasks ({manifest.filter(j => j.status === 'pending').length})
            </h2>
        </div>

        {manifest.length === 0 && (
            <div className="text-center p-8 border border-dashed border-border rounded-xl opacity-50">
                <p className="text-sm font-bold uppercase">No assignments found</p>
                <p className="text-[10px] text-muted-foreground mt-2">Waiting for dispatch...</p>
            </div>
        )}

        {manifest
            .sort((a, b) => (a.status === b.status ? 0 : a.status === 'pending' ? -1 : 1))
            .map((job) => {
              const isUrgent = job.priority === 'high' || job.priority === 'urgent';
              return (
                <button 
                  key={job.id}
                  onClick={() => {
                      if(job.status === 'pending') {
                          trigger("click")
                          setActiveJobId(job.id)
                      }
                  }}
                  disabled={job.status === 'complete'}
                  className={`group relative w-full text-left bg-card border border-border rounded-xl transition-all overflow-hidden panel-inset shadow-lg
                      ${job.status === 'complete' ? 'opacity-50 grayscale cursor-not-allowed' : 'active:scale-[0.98] active:border-primary/50 hover:border-primary/30'}
                  `}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${job.status === 'complete' ? 'bg-muted-foreground' : isUrgent ? 'bg-destructive' : 'bg-action-info'}`} />
                  <div className="p-5 pl-6">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-black bg-background/80 px-2 py-1 rounded text-muted-foreground border border-border/50 font-mono">{job.id}</span>
                      {job.status === 'complete' ? (
                          <span className="flex items-center gap-1 text-[10px] font-black text-action-success uppercase bg-action-success/10 px-2 py-1 rounded border border-action-success/20"><CheckCircle2 className="w-3 h-3" /> Complete</span>
                      ) : isUrgent && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-destructive uppercase bg-destructive/10 px-2 py-1 rounded border border-destructive/20"><AlertCircle className="w-3 h-3" /> Urgent</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex-1">
                        <h3 className={`text-lg font-black leading-tight mb-1 ${job.status === 'complete' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{job.address}</h3>
                        <p className="text-xs font-bold text-primary/90 uppercase tracking-wide truncate">{job.issue}</p>
                      </div>
                      {job.status === 'pending' && <ChevronRight className="w-6 h-6 text-muted-foreground/50 group-hover:text-primary transition-colors"/>}
                    </div>
                    <div className="mt-4 pt-3 border-t border-border/50 flex gap-4 text-xs font-bold text-muted-foreground">
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-action-info" /> {job.distance}</span>
                      <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" /> {job.timeWindow}</span>
                    </div>
                  </div>
                </button>
              )
            })}
      </main>

      {/* FOOTER: NOW WITH SMART PURGE BUTTON */}
      <footer className="p-4 pb-6 bg-card border-t border-border panel-bevel flex gap-3">
        <button 
            onClick={async () => {
                trigger("click")
                const completed = await db.jobs.where('status').equals('complete').toArray();
                
                // EMERGENCY SYNC: Try to push to cloud before deleting
                if (completed.length > 0 && navigator.onLine) {
                    await supabase.from('jobs').upsert(completed.map(j => ({
                        id: j.id,
                        assignee: j.assignee,
                        address: j.address,
                        issue: j.issue,
                        notes: j.notes,
                        distance: j.distance,
                        est_time: j.estTime,
                        priority: j.priority,
                        status: j.status,
                        time_window: j.timeWindow,
                        last_updated: j.lastUpdated
                    })))
                }

                // NUCLEAR OPTION: Clear database to ensure ghosts are gone
                await db.jobs.clear(); 
                alert("Local Cache Purged. Waiting for Dispatch...");
            }}
            className="flex-1 h-14 bg-muted/20 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg font-bold text-[10px] uppercase tracking-wide flex items-center justify-center gap-2 panel-inset transition-colors"
        >
            <X className="w-4 h-4" /> Purge Done
        </button>

        <button className="flex-[2] h-14 bg-secondary text-secondary-foreground rounded-lg font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 panel-bevel active:scale-[0.98] hover:bg-secondary/90 transition-colors">
            <Mic className="w-4 h-4" /> Dictate General Log
        </button>
      </footer>
    </div>
  )
}