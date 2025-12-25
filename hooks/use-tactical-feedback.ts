"use client"

import { useCallback } from "react"

export function useTacticalFeedback() {
  
  // Helper to generate synthetic sounds (No MP3s required)
  const playTone = (freq: number, type: OscillatorType, duration: number, volume: number = 0.1) => {
    // Check if AudioContext is supported
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return

    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    
    // Smooth attack and release to avoid "popping"
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + duration)
  }

  const trigger = useCallback((type: "click" | "success" | "error" | "start") => {
    // 1. HAPTIC FEEDBACK (The Physical Feel)
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      if (type === "click") navigator.vibrate(15) // Sharp tap
      if (type === "start") navigator.vibrate([10, 30, 10]) // Double tap
      if (type === "success") navigator.vibrate([0, 50, 20]) // Soft buzz
      if (type === "error") navigator.vibrate([50, 100, 50]) // Heavy buzz
    }

    // 2. SYNTHESIZED AUDIO (The "Beep")
    // Note: Browsers require user interaction first. These will only play after the user clicks something.
    try {
        switch (type) {
            case "click":
                // High mechanical tick
                playTone(1200, "sine", 0.05, 0.05)
                break
            case "start":
                // Lower "acknowledge" tone
                playTone(600, "square", 0.08, 0.03)
                break
            case "success":
                // High "confirm" ping
                playTone(880, "sine", 0.15, 0.05) // A5 note
                setTimeout(() => playTone(1760, "sine", 0.3, 0.03), 100) // A6 note (slight delay)
                break
            case "error":
                // Low "reject" thud
                playTone(150, "sawtooth", 0.2, 0.05)
                break
        }
    } catch (e) {
        // Ignore audio errors (e.g. if context is blocked)
    }
  }, [])

  return { trigger }
}