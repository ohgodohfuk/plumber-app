"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  LayoutDashboard, 
  Users, 
  Map as MapIcon, 
  Bell, 
  Search,
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  ClipboardList,
  X,
  Send,
  MessageSquare,
  Edit3,
  ChevronDown,
  ChevronUp
} from "lucide-react"

// --- TYPES ---
interface InvoiceData {
  customer: string
  address: string
  items: { desc: string; qty: number; price: number }[]
  total: number
  notes: string
  sms: string
}

interface LogEntry {
  id: string
  tech: string
  time: string
  type: string
  content: string
  status: string
  invoiceData?: InvoiceData
}

// --- MOCK DATA ---
const ACTIVITY_FEED: LogEntry[] = [
  {
    id: "LOG-9920",
    tech: "S. Connor",
    time: "15 mins ago",
    type: "status",
    content: "Arrived at 880 Industrial Park. Started pressure test. Access code was correct.",
    status: "logged"
  },
  {
    id: "LOG-9919",
    tech: "J. Mason",
    time: "45 mins ago",
    type: "delay",
    content: "Parts Run: Home Depot. 15m traffic delay on the bridge. Will be late to next site.",
    status: "reviewed"
  }
]

const TEAM_MEMBERS = [
  { id: "247", name: "Mason, J.", status: "working", location: "124 Maple Ave" },
  { id: "104", name: "Connor, S.", status: "traveling", location: "En Route -> Job 4822" },
  { id: "303", name: "Ripley, E.", status: "idle", location: "HQ - Resupply" }
]

// --- COMPONENT: EXPANDABLE TEXT (REUSABLE) ---
// Fixes overflow issues by forcing wrap and handling expansion verticaly
function ExpandableText({ text, limit = 80, className = "" }: { text: string, limit?: number, className?: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const shouldTruncate = text.length > limit

  if (!shouldTruncate) {
    return <p className={`break-words whitespace-pre-wrap ${className}`}>{text}</p>
  }

  return (
    <div className="relative">
      <p className={`break-words whitespace-pre-wrap transition-all duration-200 ${className} ${isExpanded ? "" : "line-clamp-2"}`}>
        {text}
      </p>
      <button 
        onClick={(e) => {
          e.stopPropagation()
          setIsExpanded(!isExpanded)
        }}
        className="text-[10px] font-black text-primary hover:underline mt-1.5 uppercase flex items-center gap-1 select-none"
      >
        {isExpanded ? (
            <>Show Less <ChevronUp className="w-3 h-3" /></>
        ) : (
            <>Read More <ChevronDown className="w-3 h-3" /></>
        )}
      </button>
    </div>
  )
}

// --- COMPONENT: INVOICE REVIEW MODAL ---
function InvoiceReviewModal({ data, onClose }: { data: InvoiceData, onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-card border border-border w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden panel-bevel flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-muted/30 border-b border-border p-6 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                             <span className="bg-primary/10 text-primary text-[10px] font-black uppercase px-2 py-1 rounded border border-primary/20">
                                AI DRAFT
                             </span>
                             <span className="text-xs font-mono text-muted-foreground">#INV-2024-001</span>
                        </div>
                        <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Invoice Review</h2>
                        <p className="text-sm text-muted-foreground">Generated from Voice Log • {data.customer}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <X className="w-6 h-6 text-muted-foreground" />
                    </button>
                </div>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* Line Items */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-border pb-2">
                            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Billable Items</h3>
                            <button className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                                <Edit3 className="w-3 h-3" /> Edit
                            </button>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="text-xs font-bold text-muted-foreground uppercase text-left">
                                <tr>
                                    <th className="pb-2">Description</th>
                                    <th className="pb-2 text-right">Qty</th>
                                    <th className="pb-2 text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody className="font-mono">
                                {data.items.map((item, i) => (
                                    <tr key={i} className="border-b border-border/50">
                                        <td className="py-3 text-foreground">{item.desc}</td>
                                        <td className="py-3 text-right text-muted-foreground">{item.qty}</td>
                                        <td className="py-3 text-right text-foreground font-bold">${item.price.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={2} className="pt-4 text-right text-xs font-bold text-muted-foreground uppercase">Total Due</td>
                                    <td className="pt-4 text-right text-xl font-black text-action-success">${data.total.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Job Notes - NOW USING EXPANDABLE TEXT */}
                    <div className="bg-muted/20 rounded-lg p-4 border border-border/50">
                         <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Technician Notes (Public)</h3>
                         <div className="text-sm text-foreground">
                            {/* Limits to 200 chars before truncating */}
                            <ExpandableText text={data.notes} limit={200} />
                         </div>
                    </div>

                    {/* Auto-Text Preview */}
                    <div className="border border-action-info/30 bg-action-info/5 rounded-lg p-4">
                         <div className="flex justify-between items-center mb-2">
                             <h3 className="text-xs font-black text-action-info uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" /> SMS Preview
                             </h3>
                             <span className="text-[10px] font-bold text-muted-foreground uppercase">Will send to 555-0123</span>
                         </div>
                         <div className="bg-background border border-border rounded p-3 text-sm font-medium text-foreground relative">
                            <div className="absolute -left-1.5 top-4 w-3 h-3 bg-background border-l border-t border-border transform -rotate-45" />
                            {data.sms}
                         </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-border bg-muted/10 flex gap-4">
                    <button className="flex-1 h-12 bg-card border border-border text-foreground rounded-lg font-bold text-sm uppercase tracking-wide hover:bg-muted transition-colors panel-bevel">
                        Save as Draft
                    </button>
                    <button onClick={onClose} className="flex-[2] h-12 bg-action-success text-action-success-foreground rounded-lg font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 hover:brightness-110 transition-all panel-bevel active:scale-[0.98]">
                        <Send className="w-4 h-4" />
                        Approve & Send All
                    </button>
                </div>

            </div>
        </div>
    )
}

// --- MAIN DASHBOARD COMPONENT ---
export default function CommandDashboard() {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null)
  const [feed, setFeed] = useState<LogEntry[]>(ACTIVITY_FEED)

  // --- SYNC LOGIC: LISTEN FOR UPDATES ---
  useEffect(() => {
    const checkForUpdates = () => {
        const storedLogs = localStorage.getItem("plumber_ops_logs")
        if (storedLogs) {
            const parsedLogs = JSON.parse(storedLogs) as LogEntry[]
            setFeed([...parsedLogs, ...ACTIVITY_FEED].slice(0, 50))
        }
    }

    checkForUpdates()
    const interval = setInterval(checkForUpdates, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="dark min-h-screen bg-background flex scanlines font-mono text-foreground overflow-hidden">
      
      {/* RENDER MODAL IF INVOICE SELECTED */}
      {selectedInvoice && (
        <InvoiceReviewModal 
            data={selectedInvoice} 
            onClose={() => setSelectedInvoice(null)} 
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-card border-r border-border flex flex-col z-20">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-action-success rounded-full" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">System Active</span>
          </div>
          <Link href="/" title="Return to Field View">
            <h1 className="text-2xl font-black uppercase tracking-tight hover:text-primary transition-colors cursor-pointer">
                OPERATIONS
            </h1>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary border border-primary/20 rounded-lg transition-all panel-inset">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wide">Overview</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all">
            <Users className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wide">Team</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all">
            <MapIcon className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wide">Map View</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all">
            <FileText className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wide">Invoices</span>
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT GRID */}
      <main className="flex-1 flex flex-col relative">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur flex items-center justify-between px-6 z-10">
            <div className="flex items-center gap-4">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input 
                    type="text" 
                    placeholder="Search jobs, clients, invoices..." 
                    className="bg-transparent border-none outline-none text-sm font-mono text-foreground placeholder:text-muted-foreground/50 w-96"
                />
            </div>
            <div className="flex items-center gap-4">
                <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-action-warning rounded-full" />
                </button>
                <div className="h-8 w-px bg-border" />
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-muted border border-border flex items-center justify-center text-xs font-black text-foreground">
                        JD
                    </div>
                </div>
            </div>
        </header>

        {/* Dashboard Grid */}
        <div className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-y-auto">
            
            {/* KPI CARDS (Top Row) */}
            <div className="col-span-12 grid grid-cols-4 gap-6 mb-2">
                <div className="bg-card border border-border p-5 rounded-xl panel-bevel">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Daily Revenue</span>
                        <DollarSign className="w-4 h-4 text-action-success" />
                    </div>
                    <div className="text-3xl font-black text-foreground">$4,250</div>
                    <div className="text-xs font-medium text-action-success mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> +12% vs avg
                    </div>
                </div>
                <div className="bg-card border border-border p-5 rounded-xl panel-bevel">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Jobs</span>
                        <Clock className="w-4 h-4 text-action-warning" />
                    </div>
                    <div className="text-3xl font-black text-foreground">8</div>
                    <div className="text-xs font-medium text-muted-foreground mt-1">2 Pending Dispatch</div>
                </div>
                {/* REPLACED "FLEET STATUS" WITH "PENDING QUOTES" */}
                <div className="bg-card border border-border p-5 rounded-xl panel-bevel">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pending Quotes</span>
                        <ClipboardList className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-3xl font-black text-foreground">5</div>
                    <div className="text-xs font-medium text-primary mt-1">Needs Review</div>
                </div>
                 <div className="bg-card border border-border p-5 rounded-xl panel-bevel relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5" />
                    <div className="relative z-10 flex flex-col h-full justify-center items-center text-center">
                        <span className="text-xs font-black text-primary uppercase tracking-widest mb-1">New Assignment</span>
                        <button className="w-full py-2 bg-primary text-primary-foreground font-bold uppercase text-sm rounded hover:bg-primary/90 transition-colors panel-bevel">
                            + Dispatch Job
                        </button>
                    </div>
                </div>
            </div>

            {/* LIVE MAP & UNITS (Main Area) */}
            <div className="col-span-8 flex flex-col gap-6">
                {/* Simulated Map */}
                <div className="flex-1 bg-card border border-border rounded-xl panel-inset relative overflow-hidden min-h-[400px]">
                     <div className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: `linear-gradient(to right, var(--color-primary) 1px, transparent 1px), linear-gradient(to bottom, var(--color-primary) 1px, transparent 1px)`,
                            backgroundSize: "40px 40px",
                        }}
                    />
                    <div className="absolute top-4 left-4 bg-background/90 backdrop-blur border border-border px-3 py-1 rounded text-[10px] font-bold text-muted-foreground uppercase">
                        Technician Locations • Lethbridge
                    </div>

                    {/* Team Markers - Simplified */}
                    {TEAM_MEMBERS.map((member, i) => (
                        <div key={member.id} className="absolute transition-all duration-1000" style={{ top: `${30 + i * 20}%`, left: `${20 + i * 25}%` }}>
                            <div className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full border shadow-sm ${
                                    member.status === 'working' ? 'bg-action-success border-action-success' :
                                    member.status === 'traveling' ? 'bg-action-warning border-action-warning' :
                                    'bg-muted-foreground border-muted-foreground'
                                }`} />
                                <div className="mt-1 bg-background/90 backdrop-blur px-2 py-0.5 rounded border border-border text-[10px] font-bold uppercase whitespace-nowrap shadow-sm">
                                    {member.name}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* INCOMING FEED (Right Panel) */}
            <div className="col-span-4 bg-card border border-border rounded-xl panel-bevel flex flex-col overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
                    <h2 className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                        Activity Log
                    </h2>
                    <span className="text-[10px] font-bold text-muted-foreground">TODAY</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {feed.map((log) => (
                        <div key={log.id} className="group relative bg-background border border-border rounded-lg p-3 transition-all hover:border-primary/50 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                                    log.type === 'invoice' ? 'bg-action-success/10 text-action-success' :
                                    log.type === 'delay' ? 'bg-destructive/10 text-destructive' :
                                    'bg-muted/50 text-muted-foreground'
                                }`}>
                                    {log.type}
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground">{log.time}</span>
                            </div>
                            
                            {/* USING EXPANDABLE TEXT COMPONENT TO FIX OVERFLOW */}
                            <div className="text-xs font-bold text-foreground leading-relaxed mb-2">
                                <ExpandableText text={log.content} limit={70} />
                            </div>

                            <div className="flex items-center justify-between border-t border-border/50 pt-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{log.tech}</span>
                                {log.type === 'invoice' && log.invoiceData && (
                                    <button 
                                        onClick={() => setSelectedInvoice(log.invoiceData || null)}
                                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                                    >
                                        Review Draft <CheckCircle2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
      </main>
    </div>
  )
}