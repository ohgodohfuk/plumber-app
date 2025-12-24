"use client"

import { useState } from "react"
import Link from "next/link" // Added for the Secret Passage
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
  Save
} from "lucide-react"

// --- TYPES ---

type WorkflowStep = "idle" | "traveling" | "arrived" | "debrief" | "complete"

interface Job {
  id: string
  address: string
  issue: string
  notes: string
  distance: string
  estTime: string
  priority: "high" | "normal" | "low"
  status: "pending" | "complete"
  timeWindow: string
}

// --- MOCK DATA INITIAL STATE ---
const INITIAL_MANIFEST: Job[] = [
  {
    id: "JOB-4821",
    address: "124 Maple Ave, Unit 3B",
    issue: "Burst Pipe - Kitchen Sink",
    notes: "Customer reports water leaking from cabinet. Main shutoff valve already closed. Bring extra compression fittings.",
    distance: "3.2 mi",
    estTime: "8 min",
    priority: "high",
    status: "pending",
    timeWindow: "08:00 - 10:00"
  },
  {
    id: "JOB-4822",
    address: "880 Industrial Park Rd",
    issue: "Backflow Preventer Test",
    notes: "Annual commercial testing. Access code: 1234#",
    distance: "8.4 mi",
    estTime: "15 min",
    priority: "normal",
    status: "pending",
    timeWindow: "10:30 - 12:00"
  },
  {
    id: "JOB-4823",
    address: "15 West Main St",
    issue: "Water Heater Install",
    notes: "Replace 40G electric. Unit is in the garage.",
    distance: "12.1 mi",
    estTime: "22 min",
    priority: "normal",
    status: "pending",
    timeWindow: "13:00 - 16:00"
  }
]

// --- COMPONENT: DEBRIEF MODAL (The Voice Recorder) ---
function DebriefModal({ onCancel, onSubmit }: { onCancel: () => void, onSubmit: () => void }) {
    const [isRecording, setIsRecording] = useState(false)
    
    return (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex flex-col p-6 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-8 border-b border-border/50 pb-4">
                <h2 className="text-xl font-black uppercase text-foreground tracking-widest">
                    Mission Debrief
                </h2>
                <button onClick={onCancel} className="p-2 text-muted-foreground hover:text-foreground">
                    <X className="w-8 h-8" />
                </button>
            </div>

            {/* Recording Interface */}
            <div className="flex-1 flex flex-col items-center justify-center gap-8">
                <div 
                    className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isRecording 
                        ? 'bg-destructive/20 border-4 border-destructive shadow-[0_0_50px_var(--color-destructive)]' 
                        : 'bg-secondary border-4 border-border'
                    }`}
                    onMouseDown={() => setIsRecording(true)}
                    onMouseUp={() => setIsRecording(false)}
                    onTouchStart={() => setIsRecording(true)}
                    onTouchEnd={() => setIsRecording(false)}
                >
                    <div className={`absolute inset-0 rounded-full border border-destructive opacity-0 ${isRecording ? 'animate-ping opacity-100' : ''}`} />
                    
                    {isRecording ? (
                        <Square className="w-16 h-16 text-destructive fill-current" />
                    ) : (
                        <Mic className="w-16 h-16 text-foreground" />
                    )}
                </div>

                <div className="text-center space-y-2">
                    <h3 className={`text-2xl font-black uppercase tracking-widest ${isRecording ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
                        {isRecording ? "RECORDING..." : "HOLD TO RECORD"}
                    </h3>
                    <p className="text-xs font-mono text-muted-foreground max-w-[200px] mx-auto">
                        Dictate work performed, parts used, and any follow-up requirements.
                    </p>
                </div>
            </div>

            {/* Manual Notes Fallback */}
            <div className="mt-auto space-y-4">
                 <textarea 
                    placeholder="Or type manual notes here..."
                    className="w-full bg-card border border-border rounded-xl p-4 min-h-[100px] text-sm font-mono focus:border-primary transition-colors panel-inset"
                 />
                 <button 
                    onClick={onSubmit}
                    className="w-full h-16 bg-action-success text-action-success-foreground rounded-xl font-black text-lg uppercase tracking-wide flex items-center justify-center gap-2 panel-bevel active:scale-[0.98]"
                 >
                    <Save className="w-5 h-5" />
                    Submit & Close Job
                 </button>
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
    if (step === "debrief") {
        setShowDebrief(true)
    } else {
        setCurrentStep(step)
    }
  }

  const handleReset = () => {
    setCurrentStep("idle")
    setShowResetConfirm(false)
  }

  const isJobInProgress = currentStep !== "idle" && currentStep !== "complete"

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* DEBRIEF MODAL OVERLAY */}
      {showDebrief && (
        <DebriefModal 
            onCancel={() => setShowDebrief(false)}
            onSubmit={() => {
                setShowDebrief(false)
                onComplete(job.id)
            }} 
        />
      )}

      {/* Job Header */}
      <header className="w-full bg-card border-b border-border px-4 py-4 panel-bevel flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
                 <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-action-success rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-action-success tracking-wider uppercase">Active Job</span>
                </div>
                <span className="text-sm font-bold text-foreground">{job.id}</span>
            </div>
        </div>
        
        {isJobInProgress && (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors px-3 py-2 rounded border border-border/50 bg-background/50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESET
          </button>
        )}
      </header>

      {/* Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-card border border-border rounded-lg p-6 panel-bevel max-w-sm w-full shadow-2xl">
            <h2 className="text-lg font-black text-foreground uppercase mb-2">Reset Protocols?</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Current progress will be lost. Confirm reset.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 h-12 bg-secondary text-secondary-foreground rounded-lg font-bold text-sm uppercase tracking-wide panel-bevel"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 h-12 bg-destructive text-destructive-foreground rounded-lg font-bold text-sm uppercase tracking-wide panel-bevel"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
        {currentStep === "traveling" ? (
          <div className="flex-1 flex flex-col">
            {/* Tactical Map */}
            <div className="flex-1 bg-card border border-border rounded-xl panel-inset overflow-hidden relative min-h-[300px]">
              <div className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `linear-gradient(to right, var(--color-action-success) 1px, transparent 1px), linear-gradient(to bottom, var(--color-action-success) 1px, transparent 1px)`,
                  backgroundSize: "40px 40px",
                }}
              />
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-full border-4 border-action-success/30 flex items-center justify-center mb-6 animate-pulse">
                  <Navigation className="w-10 h-10 text-action-success" />
                </div>
                <h2 className="text-2xl font-black text-foreground mb-1">{job.address}</h2>
                <p className="text-lg text-muted-foreground font-medium">
                  {job.distance} • ETA {job.estTime}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => handleAction("arrived")}
                className="w-full h-24 bg-action-info text-action-info-foreground rounded-xl font-black text-2xl uppercase tracking-wide flex items-center justify-center gap-4 panel-bevel active:scale-[0.98] transition-transform"
              >
                <MapPin className="w-8 h-8" />
                ARRIVED ON SITE
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Job Details Card */}
            <div className="bg-card border border-border rounded-xl p-5 panel-inset space-y-4">
               <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target Location</span>
                  <h1 className="text-xl font-black text-foreground mt-1 leading-tight">{job.address}</h1>
               </div>
               
               <div className="pt-4 border-t border-border/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Critical Issue</span>
                    {job.priority === 'high' && (
                        <span className="text-[10px] font-black text-destructive uppercase bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20">High Priority</span>
                    )}
                  </div>
                  <p className="text-lg font-bold text-destructive">{job.issue}</p>
               </div>

               <div className="bg-background/40 border border-border/50 rounded-lg p-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Dispatcher Notes</span>
                  <p className="text-sm text-foreground/80 leading-relaxed font-medium">{job.notes}</p>
               </div>
            </div>

            {/* Action Grid */}
            <div className="flex flex-col gap-3 mt-auto pb-4">
              <button
                onClick={() => handleAction("traveling")}
                disabled={currentStep !== "idle"}
                className="w-full h-20 bg-action-warning text-action-warning-foreground rounded-xl font-black text-lg uppercase tracking-wide flex items-center justify-center gap-3 panel-bevel active:scale-[0.98] disabled:opacity-30 disabled:grayscale transition-all"
              >
                <Navigation className="w-6 h-6" />
                Start Travel
              </button>

              <button
                onClick={() => handleAction("arrived")}
                disabled={true}
                className="w-full h-20 bg-action-info text-action-info-foreground rounded-xl font-black text-lg uppercase tracking-wide flex items-center justify-center gap-3 panel-bevel active:scale-[0.98] disabled:opacity-30 disabled:grayscale transition-all"
              >
                <MapPin className="w-6 h-6" />
                Arrived
              </button>

              <button
                onClick={() => handleAction("debrief")}
                disabled={currentStep !== "arrived"}
                className="w-full h-20 bg-action-success text-action-success-foreground rounded-xl font-black text-lg uppercase tracking-wide flex items-center justify-center gap-3 panel-bevel active:scale-[0.98] disabled:opacity-30 disabled:grayscale transition-all"
              >
                <CheckCircle2 className="w-6 h-6" />
                Job Complete
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Footer Status */}
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
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [manifest, setManifest] = useState<Job[]>(INITIAL_MANIFEST)

  // Derived state to find the active job object
  const activeJob = manifest.find(j => j.id === activeJobId)

  // Handle job completion
  const handleJobComplete = (id: string) => {
    // 1. Mark job as complete in state
    setManifest(prev => prev.map(job => 
        job.id === id ? { ...job, status: "complete" } : job
    ))
    // 2. Close the active view
    setActiveJobId(null)
  }

  // If a job is selected, show the Active Job View
  if (activeJob) {
    return (
      <div className="dark min-h-screen bg-background scanlines font-mono text-foreground">
        <ActiveJobView 
            job={activeJob} 
            onBack={() => setActiveJobId(null)} 
            onComplete={handleJobComplete}
        />
      </div>
    )
  }

  // Otherwise, show the Manifest (Job List)
  return (
    <div className="dark min-h-screen bg-background flex flex-col scanlines font-mono text-foreground select-none">
      
      {/* iOS-style Status Bar Simulation */}
      <div className="bg-background/90 backdrop-blur px-6 py-2 flex justify-between items-center text-[10px] font-bold text-muted-foreground border-b border-border/50 sticky top-0 z-50">
        <span>08:42 AM</span>
        <div className="flex gap-3">
          {/* SECRET ADMIN PASSAGE: Click 'LTE' to go to Dashboard */}
          <Link href="/dashboard" className="flex items-center gap-1 hover:text-action-success cursor-pointer transition-colors" title="Open Command Dashboard">
             <Signal className="w-3 h-3" /> LTE
          </Link>
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
            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
              Daily Manifest
            </h1>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider">Date</span>
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
                <span className="text-[10px] font-black bg-background/80 px-2 py-1 rounded text-muted-foreground border border-border/50 font-mono">
                    {job.id}
                </span>
                {job.status === 'complete' ? (
                     <span className="flex items-center gap-1 text-[10px] font-black text-action-success uppercase bg-action-success/10 px-2 py-1 rounded border border-action-success/20">
                        <CheckCircle2 className="w-3 h-3" /> Complete
                    </span>
                ) : job.priority === 'high' && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-destructive uppercase bg-destructive/10 px-2 py-1 rounded border border-destructive/20">
                        <AlertCircle className="w-3 h-3" /> Priority
                    </span>
                )}
              </div>

              {/* Address & Issue */}
              <div className="flex justify-between items-center gap-4">
                <div className="flex-1">
                  <h3 className={`text-lg font-black leading-tight mb-1 ${job.status === 'complete' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {job.address}
                  </h3>
                  <p className="text-xs font-bold text-primary/90 uppercase tracking-wide truncate">
                    {job.issue}
                  </p>
                </div>
                {job.status === 'pending' && (
                    <ChevronRight className="w-6 h-6 text-muted-foreground/50 group-hover:text-primary transition-colors"/>
                )}
              </div>

              {/* Footer Metadata */}
              <div className="mt-4 pt-3 border-t border-border/50 flex gap-4 text-xs font-bold text-muted-foreground">
                 <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-action-info" /> {job.distance}
                 </span>
                 <span className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" /> {job.timeWindow}
                 </span>
              </div>
            </div>
          </button>
        ))}
      </main>

      {/* Footer Action */}
      <footer className="p-4 pb-6 bg-card border-t border-border panel-bevel">
        <button className="w-full h-14 bg-secondary text-secondary-foreground rounded-lg font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 panel-bevel active:scale-[0.98] hover:bg-secondary/90 transition-colors">
            <Mic className="w-4 h-4" />
            Dictate General Log
        </button>
      </footer>

    </div>
  )
}