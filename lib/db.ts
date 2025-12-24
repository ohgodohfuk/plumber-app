// lib/db.ts
import Dexie, { Table } from 'dexie';

// 1. Define what a "Job" looks like in the database
export interface Job {
  id: string;
  address: string;
  issue: string;
  notes: string;
  distance: string;
  estTime: string;
  priority: 'high' | 'normal' | 'low';
  status: 'pending' | 'complete'; // Simplified status for the manifest
  timeWindow: string;
  lastUpdated?: number; 
}

// 2. Create the Database Class
export class IronCladDB extends Dexie {
  jobs!: Table<Job>;

  constructor() {
    super('IronCladDB');
    this.version(1).stores({
      jobs: 'id, status, priority' // These are the fields we can query fast
    });
  }
}

export const db = new IronCladDB();

// 3. Seed Data (So you have something to see immediately)
export const seedDatabase = async () => {
    const count = await db.jobs.count();
    if (count === 0) {
        await db.jobs.bulkAdd([
            {
                id: "JOB-4821",
                address: "124 Maple Ave, Unit 3B",
                issue: "Burst Pipe - Kitchen Sink",
                notes: "Customer reports water leaking from cabinet. Main shutoff valve already closed.",
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
        ]);
    }
};