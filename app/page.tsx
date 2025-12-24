"use client"
import { useState } from "react"
import { Navigation, MapPin, CheckCircle2, X, RotateCcw } from "lucide-react"

type WorkflowStep = "idle" | "traveling" | "arrived" | "complete"

interface Job {
  id: string
  address: string
  issue: string
  notes: string
  distance: string
  estTime: string
}

interface PlumberAppProps {
  job?: Job
}

const defaultJob: Job = {
  id: "JOB-4821",
  address: "124 Maple Ave, Unit 3B",
  issue: "Burst Pipe - Kitchen Sink",
  notes:
    "Customer reports water leaking from cabinet. Main shutoff valve already closed. Bring extra compression fittings.",
  distance: "3.2 miles",
  estTime: "8 min",
}

export default function PlumberApp({ job = defaultJob }: PlumberAppProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("idle")
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const handleAction = (step: WorkflowStep) => {
    setCurrentStep(step)
  }

  const handleReset = () => {
    setCurrentStep("idle")
    setShowResetConfirm(false)
  }

  const isJobInProgress = currentStep !== "idle" && currentStep !== "complete"

  return (
    <div className="dark min-h-screen bg-background flex flex-col scanlines font-mono">
      {/* Header */}
      <header className="w-full bg-card border-b border-border px-6 py-4 panel-bevel">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-action-success rounded-full" />
            <span className="text-sm font-bold text-foreground">Plumber ID: 247</span>
          </div>
          <div className="flex items-center gap-3">
            {isJobInProgress && (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded border border-transparent hover:border-destructive/30"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
            <span className="text-xs font-medium text-muted-foreground">Connected</span>
          </div>
        </div>
      </header>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-card border border-border rounded-lg p-6 panel-bevel max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Reset Job?</h2>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              This will reset your current progress back to the start. Are you sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 h-12 bg-secondary text-secondary-foreground rounded-lg font-bold text-sm uppercase tracking-wide transition-all active:scale-[0.98] panel-bevel"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 h-12 bg-destructive text-destructive-foreground rounded-lg font-bold text-sm uppercase tracking-wide transition-all active:scale-[0.98] panel-bevel"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-6 gap-6">
        {currentStep === "traveling" ? (
          <div className="flex-1 flex flex-col">
            {/* Tactical Map Placeholder */}
            <div className="flex-1 bg-card border border-border rounded-lg panel-inset overflow-hidden relative">
              {/* Grid overlay */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, var(--color-action-success) 1px, transparent 1px),
                    linear-gradient(to bottom, var(--color-action-success) 1px, transparent 1px)
                  `,
                  backgroundSize: "40px 40px",
                }}
              />

              {/* Map content */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 rounded-full border-2 border-action-success flex items-center justify-center mb-4 animate-pulse">
                  <Navigation className="w-8 h-8 text-action-success" />
                </div>
                <span className="text-xs font-semibold text-action-success uppercase tracking-widest mb-2">
                  Navigating To
                </span>
                <h2 className="text-xl font-black text-foreground text-center mb-1">{job.address}</h2>
                <p className="text-sm text-muted-foreground">
                  {job.distance} • ETA {job.estTime}
                </p>

                {/* Route indicator */}
                <div className="mt-8 flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-action-success" />
                  <div
                    className="h-0.5 w-24 bg-action-success/50"
                    style={{
                      background:
                        "repeating-linear-gradient(90deg, var(--color-action-success) 0, var(--color-action-success) 8px, transparent 8px, transparent 12px)",
                    }}
                  />
                  <MapPin className="w-5 h-5 text-action-info" />
                </div>

                {/* Job ID */}
                <div className="absolute bottom-4 left-4">
                  <span className="text-xs font-mono text-muted-foreground">{job.id}</span>
                </div>
              </div>
            </div>

            {/* Arrived Button - shown during navigation */}
            <div className="mt-6">
              <button
                onClick={() => handleAction("arrived")}
                className="w-full h-24 bg-action-info text-action-info-foreground rounded-xl font-black text-xl uppercase tracking-wide flex items-center justify-center gap-3 transition-all active:scale-[0.98] border-2 border-transparent hover:border-action-info-foreground/20 panel-bevel"
              >
                <MapPin className="w-8 h-8" />
                Arrived
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Job Details - using dynamic props */}
            <div className="bg-card border border-border rounded-lg p-6 panel-inset">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Current Job
                    </span>
                    <h1 className="text-2xl font-black text-foreground mt-1 text-balance">{job.address}</h1>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground bg-background/50 px-2 py-1 rounded border border-border">
                    {job.id}
                  </span>
                </div>

                <div className="pt-3 border-t border-border">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Issue</span>
                  <p className="text-base font-bold text-destructive mt-1">{job.issue}</p>
                  <div className="mt-3 bg-background/50 border border-border rounded p-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</span>
                    <p className="text-sm text-foreground/80 mt-1 leading-relaxed">{job.notes}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Distance</span>
                    <p className="text-lg font-bold text-foreground mt-1">{job.distance}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Est. Time</span>
                    <p className="text-lg font-bold text-foreground mt-1">{job.estTime}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 mt-auto">
              <button
                onClick={() => handleAction("traveling")}
                disabled={currentStep !== "idle"}
                className="w-full h-24 bg-action-warning text-action-warning-foreground rounded-xl font-black text-xl uppercase tracking-wide flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border-2 border-transparent hover:border-action-warning-foreground/20 panel-bevel"
              >
                <Navigation className="w-8 h-8" />
                Start Travel
              </button>

              <button
                onClick={() => handleAction("arrived")}
                disabled={currentStep !== "traveling" as any}
                className="w-full h-24 bg-action-info text-action-info-foreground rounded-xl font-black text-xl uppercase tracking-wide flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border-2 border-transparent hover:border-action-info-foreground/20 panel-bevel"
              >
                <MapPin className="w-8 h-8" />
                Arrived
              </button>

              <button
                onClick={() => handleAction("complete")}
                disabled={currentStep !== "arrived"}
                className="w-full h-24 bg-action-success text-action-success-foreground rounded-xl font-black text-xl uppercase tracking-wide flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border-2 border-transparent hover:border-action-success-foreground/20 panel-bevel"
              >
                <CheckCircle2 className="w-8 h-8" />
                Job Complete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Status Footer */}
      <footer className="w-full bg-card border-t border-border px-6 py-4 panel-bevel">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</span>
          <span className="text-sm font-bold text-foreground capitalize">
            {currentStep === "idle" && "Ready"}
            {currentStep === "traveling" && "En Route"}
            {currentStep === "arrived" && "On Site"}
            {currentStep === "complete" && "Job Finished"}
          </span>
        </div>
      </footer>
    </div>
  )
}
