"use client"

import { useEffect, useRef } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { supabase } from "@/lib/supabase"
import { db, Job } from "@/lib/db"

export function SyncEngine() {
  // 1. WATCH LOCAL DB FOR CHANGES
  // We grab all jobs so we can check if any need syncing
  const localJobs = useLiveQuery(() => db.jobs.toArray())
  
  // Ref to prevent "echo loop" (Cloud -> Local -> Cloud)
  const isSyncingRef = useRef(false)

  // 2. THE UPLINK (Local -> Cloud)
  useEffect(() => {
    if (!localJobs || isSyncingRef.current) return

    const pushToCloud = async () => {
      // Find jobs that might need syncing.
      // Ideally we'd have a 'dirty' flag, but for now we sync 'complete' jobs.
      // Supabase's 'upsert' is cheap, so we can just push completed jobs to be safe.
      const jobsToSync = localJobs.filter(j => j.status === 'complete')

      if (jobsToSync.length === 0) return

      // Check internet
      if (!navigator.onLine) {
        console.log("📡 SYNC: Offline. Holding payload.")
        return
      }

      console.log(`📡 UPLINK: Pushing ${jobsToSync.length} completed jobs to Cloud...`)
      
      const { error } = await supabase
        .from('jobs')
        .upsert(jobsToSync.map(j => ({
            id: j.id,
            assignee: j.assignee,
            address: j.address,
            issue: j.issue,
            notes: j.notes, // <--- Now includes voice notes
            distance: j.distance,
            est_time: j.estTime,
            priority: j.priority,
            status: j.status,
            time_window: j.timeWindow,
            last_updated: j.lastUpdated
        })))

      if (error) {
        console.error("📡 UPLINK ERROR:", error)
      } else {
        console.log("✅ UPLINK: Payload delivered.")
      }
    }

    // Debounce slightly to allow the DB write to settle
    const timeout = setTimeout(pushToCloud, 1000)
    return () => clearTimeout(timeout)

  }, [localJobs])


  // 3. THE DOWNLINK (Cloud -> Local)
  useEffect(() => {
    const pullFromCloud = async () => {
      isSyncingRef.current = true // Lock the uplink while we pull
      console.log("📡 DOWNLINK: Checking for orders...")
      
      const { data, error } = await supabase.from('jobs').select('*')
      
      if (!error && data) {
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
        await db.jobs.bulkPut(formattedJobs)
      }
      isSyncingRef.current = false // Unlock
    }

    pullFromCloud()

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
          pullFromCloud()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return null
}