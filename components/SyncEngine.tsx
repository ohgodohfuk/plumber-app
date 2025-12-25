"use client"

import { useEffect, useRef } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { supabase } from "@/lib/supabase"
import { db, Job } from "@/lib/db"

export function SyncEngine() {
  const localJobs = useLiveQuery(() => db.jobs.toArray())
  const isSyncingRef = useRef(false)

  // 1. UPLINK (Push Local Changes to Cloud)
  useEffect(() => {
    if (!localJobs || isSyncingRef.current) return

    const pushToCloud = async () => {
      // Find jobs that need syncing (Completed jobs with notes)
      const jobsToSync = localJobs.filter(j => j.status === 'complete')

      if (jobsToSync.length === 0) return
      if (!navigator.onLine) return

      console.log(`📡 UPLINK: Pushing ${jobsToSync.length} completed jobs...`)
      
      const { error } = await supabase
        .from('jobs')
        .upsert(jobsToSync.map(j => ({
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

      if (error) console.error("📡 UPLINK ERROR:", error)
      else console.log("✅ UPLINK: Success.")
    }

    const timeout = setTimeout(pushToCloud, 2000) // 2s Debounce
    return () => clearTimeout(timeout)
  }, [localJobs])


  // 2. DOWNLINK (Fetch Assignments from Cloud)
  useEffect(() => {
    const pullFromCloud = async () => {
      isSyncingRef.current = true
      
      // FIX: Only fetch 'pending' jobs. 
      // If a job is 'complete' in the cloud, do not re-download it.
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'pending') // <--- THE FILTER

      if (!error && data) {
        console.log(`📡 DOWNLINK: Synced ${data.length} pending jobs.`)
        
        const formattedJobs: Job[] = data.map((j: any) => ({
            id: j.id,
            assignee: j.assignee,
            address: j.address,
            issue: j.issue,
            notes: j.notes,
            distance: j.distance,
            estTime: j.est_time,
            priority: j.priority,
            status: j.status,
            timeWindow: j.time_window,
            lastUpdated: j.last_updated
        }))
        
        // We use bulkPut to update existing or add new.
        // We do NOT delete local completed jobs here (so the tech can still see what they just did).
        await db.jobs.bulkPut(formattedJobs)
      }
      isSyncingRef.current = false
    }

    pullFromCloud()

    // Listen for NEW assignments only
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'jobs', filter: 'status=eq.pending' }, 
          () => pullFromCloud()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return null
}