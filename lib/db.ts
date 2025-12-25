// lib/db.ts
import Dexie, { Table } from 'dexie';

// 1. Define what a "Job" looks like in the database
export interface Job {
  id: string;
  assignee: string; // Ensure this exists from previous step
  address: string;
  issue: string;
  notes: string;
  distance: string;
  estTime: string;
  // UPDATE: Added 'urgent' to the allowed types
  priority: 'high' | 'normal' | 'low' | 'urgent'; 
  status: 'pending' | 'complete';
  timeWindow: string;
  lastUpdated?: number; 
}

// 2. Create the Database Class
export class IronCladDB extends Dexie {
  jobs!: Table<Job>;

  constructor() {
    super('IronCladDB');
    // We bump the version to 2 to safely upgrade the schema
    this.version(2).stores({
      jobs: 'id, assignee, status, priority' 
    });
  }
}

export const db = new IronCladDB();

// 3. Seed Data
export const seedDatabase = async () => {
    const count = await db.jobs.count();
    if (count === 0) {
        await db.jobs.bulkAdd([
            {
                id: "JOB-4821",
                assignee: "Mason, J.",
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
                assignee: "Connor, S.",
                address: "880 Industrial Park Rd",
                issue: "Backflow Preventer Test",
                notes: "Annual commercial testing. Access code: 1234#",
                distance: "8.4 mi",
                estTime: "15 min",
                priority: "normal",
                status: "pending",
                timeWindow: "10:30 - 12:00"
            }
        ]);
    }
};