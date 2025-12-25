"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useLiveQuery } from "dexie-react-hooks"
import { db, seedDatabase, Job } from "@/lib/db"
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
  Power
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
                        onClick={() => onLogin(user.name)}
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

// --- COMPONENT: DEBRIEF MODAL (Voice) ---
function DebriefModal({ onCancel, onSubmit }: { onCancel: () => void, onSubmit: (notes: string) => void }) {
    const [isRecording, setIsRecording] = useState(false)
    const [notes, setNotes] = useState("")
    const recognitionRef = useRef<any>(null)
    
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
                    if (transcript) setNotes(prev => (prev + transcript).trim() + " ")
                }
                recognitionRef.current = recognition
            }
        }
    }, [])

    const startListening = () => {
        if (!recognitionRef.current) {
            alert("Voice input not supported in this browser.")
            return
        }
        setIsRecording(true)
        try { recognitionRef.current.start() } catch (e) { console.error(e) }
    }

    const stopListening = () => {
        setIsRecording(false)
        if (recognitionRef.current) recognitionRef.current.stop()
    }
    
    return (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex flex-col p-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-8 border-b border-border/50 pb-4">
                <h2 className="text-xl font-black uppercase text-foreground tracking-widest">Mission Debrief</h2>
                <button onClick={onCancel} className="p-2 text-muted-foreground hover:text-foreground"><X className="w-8 h-8" /></button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-8">
                <div 
                    className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording ? 'bg-destructive/20 border-4 border-destructive shadow-[0_0_50px_var(--color-destructive)] scale-110' : 'bg-secondary border-4 border-border'}`}
                    onMouseDown={startListening} onMouseUp={stopListening} onMouseLeave={stopListening}
                    onTouchStart={(e) => { e.preventDefault(); startListening() }} onTouchEnd={(e) => { e.preventDefault(); stopListening() }}
                >
                    <div className={`absolute inset-0 rounded-full border border-destructive opacity-0 ${isRecording ? 'animate-ping opacity-100' : ''}`} />
                    {isRecording ? <Square className="w-16 h-16 text-destructive fill-current" /> : <Mic className="w-16 h-16 text-foreground" />}
                </div>
                <div className="text-center space-y-2">
                    <h3 className={`text-2xl font-black uppercase tracking-widest ${isRecording ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>{isRecording ? "LISTENING..." : "HOLD TO SPEAK"}</h3>
                    <p className="text-xs font-mono text-muted-foreground max-w-[200px] mx-auto">AI will transcribe your voice logs directly.</p>
                </div>
            </div>
            <div className="mt-auto space-y-4">
                 <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Transcription appears here..." className="w-full bg-card border border-border rounded-xl p-4 min-h-[100px] text-sm font-mono focus:border-primary transition-colors panel-inset" />
                 <button onClick={() => onSubmit(notes)} className="w-full h-16 bg-action-success text-action-success-foreground rounded-xl font-black text-lg uppercase tracking-wide flex items-center justify-center gap-2 panel-bevel active:scale-[0.98]"><Save className="w-5 h-5" /> Submit & Close Job</button>
            </div>
        </div>
    )
}

// --- COMPONENT: ACTIVE JOB VIEW ---
function ActiveJobView({ job, onBack, onComplete }: { job: Job; onBack: () => void; onComplete: (id: string) => void }) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("idle")
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showDebrief, setShowDebrief] = useState(false)

  const handleAction = (step: WorkflowStep) => {
    if (step === "debrief") setShowDebrief(true)
    else setCurrentStep(step)
  }

  const handleReset = () => {
    setCurrentStep("idle")
    setShowResetConfirm(false)
  }

  const handleDebriefSubmit = (notes: string) => {
    const newLog = {
        id: `LOG-${Date.now()}`,
        tech: job.assignee, // Use real assignee from job
        time: "Just now",
        type: "invoice",
        content: `Job ${job.id} Complete. ${notes || "No notes provided."}`,
        status: "processing",
        invoiceData: {
            customer: "Lethbridge Resident",
            address: job.address,
            items: [{ desc: "Service Call", qty: 1, price: 150.00 }, { desc: "Labor", qty: 1, price: 85.00 }],
            total: 235.00,
            notes: notes,
            sms: `Your service at ${job.address} is complete. Total: $235.00.`
        }
    }
    
    // Optimistic Update to LocalStorage for Dashboard Sync
    if (typeof window !== 'undefined') {
        const existingLogs = JSON.parse(localStorage.getItem("plumber_ops_logs") || "[]")
        localStorage.setItem("plumber_ops_logs", JSON.stringify([newLog, ...existingLogs]))
        // Trigger storage event manually if in same tab context (though usually dashboard is separate)
        window.dispatchEvent(new Event("storage"))
    }

    setShowDebrief(false)
    onComplete(job.id)
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
                    <span className="w-2 h-2 bg-action-success rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-action-success tracking-wider uppercase">Active Job</span>
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
                    {job.priority === 'high' && <span className="text-[10px] font-black text-destructive uppercase bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20">High Priority</span>}
                  </div>
                  <p className="text-lg font-bold text-destructive">{job.issue}</p>
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
  const [currentUser, setCurrentUser] = useState<string | null>(null) // <--- IDENTITY STATE
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  
  // FILTERED QUERY: Only show jobs assigned to the current user
  const manifest = useLiveQuery(
    () => currentUser ? db.jobs.where('assignee').equals(currentUser).toArray() : [],
    [currentUser]
  )

  useEffect(() => { seedDatabase() }, [])

  const handleJobComplete = async (id: string) => {
    // Note: manifest might be undefined initially, but Dexie hooks handle this gracefully.
    // If we're completing a job, we know it exists.
    await db.jobs.update(id, { status: "complete", lastUpdated: Date.now() })
    setActiveJobId(null)
  }

  // --- SHOW LOGIN SCREEN IF NO USER ---
  if (!currentUser) {
      return <LoginScreen onLogin={setCurrentUser} />
  }

  // Dexie returns undefined while loading
  if (!manifest) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono scanlines">
            <div className="text-action-success animate-pulse text-xl font-black tracking-widest uppercase">
                Initializing IronClad DB...
            </div>
        </div>
      )
  }

  const activeJob = manifest.find(j => j.id === activeJobId)

  // If a job is selected, show the Active Job View
  if (activeJob) {
    return (
      <div className="dark min-h-screen bg-background scanlines font-mono text-foreground">
        <ActiveJobView job={activeJob as any} onBack={() => setActiveJobId(null)} onComplete={handleJobComplete} />
      </div>
    )
  }

  // --- MANIFEST UI ---
  return (
    <div className="dark min-h-screen bg-background flex flex-col scanlines font-mono text-foreground select-none">
      
      {/* iOS-style Status Bar Simulation */}
      <div className="bg-background/90 backdrop-blur px-6 py-2 flex justify-between items-center text-[10px] font-bold text-muted-foreground border-b border-border/50 sticky top-0 z-50">
        <span>08:42 AM</span>
        <div className="flex gap-3">
          <Link href="/dashboard" className="flex items-center gap-1 hover:text-action-success cursor-pointer transition-colors" title="Open Command Dashboard"><Signal className="w-3 h-3" /> LTE</Link>
          <div className="flex items-center gap-1"><Battery className="w-3 h-3" /> 84%</div>
        </div>
      </div>

      {/* Main Header */}
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

      {/* Scrollable Job List */}
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
            // Sort: Pending first, Complete last
            .sort((a, b) => (a.status === b.status ? 0 : a.status === 'pending' ? -1 : 1))
            .map((job) => (
          <button 
            key={job.id}
            onClick={() => job.status === 'pending' && setActiveJobId(job.id)}
            disabled={job.status === 'complete'}
            className={`group relative w-full text-left bg-card border border-border rounded-xl transition-all overflow-hidden panel-inset shadow-lg
                ${job.status === 'complete' ? 'opacity-50 grayscale cursor-not-allowed' : 'active:scale-[0.98] active:border-primary/50 hover:border-primary/30'}
            `}
          >
            {/* Priority Status Stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                job.status === 'complete' ? 'bg-muted-foreground' :
                job.priority === 'high' ? 'bg-destructive' : 'bg-action-info'
            }`} />

            <div className="p-5 pl-6">
              {/* ID & Priority Badge */}
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-black bg-background/80 px-2 py-1 rounded text-muted-foreground border border-border/50 font-mono">{job.id}</span>
                {job.status === 'complete' ? (
                     <span className="flex items-center gap-1 text-[10px] font-black text-action-success uppercase bg-action-success/10 px-2 py-1 rounded border border-action-success/20"><CheckCircle2 className="w-3 h-3" /> Complete</span>
                ) : job.priority === 'high' && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-destructive uppercase bg-destructive/10 px-2 py-1 rounded border border-destructive/20"><AlertCircle className="w-3 h-3" /> Priority</span>
                )}
              </div>

              {/* Address & Issue */}
              <div className="flex justify-between items-center gap-4">
                <div className="flex-1">
                  <h3 className={`text-lg font-black leading-tight mb-1 ${job.status === 'complete' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{job.address}</h3>
                  <p className="text-xs font-bold text-primary/90 uppercase tracking-wide truncate">{job.issue}</p>
                </div>
                {job.status === 'pending' && <ChevronRight className="w-6 h-6 text-muted-foreground/50 group-hover:text-primary transition-colors"/>}
              </div>

              {/* Footer Metadata */}
              <div className="mt-4 pt-3 border-t border-border/50 flex gap-4 text-xs font-bold text-muted-foreground">
                 <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-action-info" /> {job.distance}</span>
                 <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" /> {job.timeWindow}</span>
              </div>
            </div>
          </button>
        ))}
      </main>

      {/* Footer Action */}
      <footer className="p-4 pb-6 bg-card border-t border-border panel-bevel">
        <button className="w-full h-14 bg-secondary text-secondary-foreground rounded-lg font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 panel-bevel active:scale-[0.98] hover:bg-secondary/90 transition-colors">
            <Mic className="w-4 h-4" /> Dictate General Log
        </button>
      </footer>

    </div>
  )
}