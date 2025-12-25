// lib/db.ts
import Dexie, { Table } from 'dexie';

export interface Job {
  id: string;
  assignee: string; // <--- NEW FIELD
  address: string;
  issue: string;
  notes: string;
  distance: string;
  estTime: string;
  priority: 'high' | 'normal' | 'low';
  status: 'pending' | 'traveling' | 'arrived' | 'complete';
  timeWindow: string;
  lastUpdated?: number; 
}

export class IronCladDB extends Dexie {
  jobs!: Table<Job>;

  constructor() {
    super('IronCladDB');
    this.version(2).stores({ // <--- BUMPED VERSION TO 2
      jobs: 'id, assignee, status, priority' 
    });
  }
}

export const db = new IronCladDB();

// Seed with assigned jobs
export const seedDatabase = async () => {
    const count = await db.jobs.count();
    if (count === 0) {
        await db.jobs.bulkAdd([
            {
                id: "JOB-4821",
                assignee: "Mason, J.",
                address: "124 Maple Ave, Unit 3B",
                issue: "Burst Pipe - Kitchen Sink",
                notes: "Water leaking from cabinet. Shutoff valve closed.",
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