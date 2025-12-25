"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { supabase } from "@/lib/supabase"
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
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Printer,
  Radio,
  ArrowRight,
  Trash2
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

const TEAM_MEMBERS = [
  { id: "247", name: "Mason, J.", status: "working", location: "124 Maple Ave" },
  { id: "104", name: "Connor, S.", status: "traveling", location: "En Route -> Job 4822" },
  { id: "303", name: "Ripley, E.", status: "idle", location: "HQ - Resupply" }
]

// --- COMPONENT: EXPANDABLE TEXT ---
function ExpandableText({ text, limit = 80, className = "" }: { text: string, limit?: number, className?: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (!text) return <span className="italic text-muted-foreground">No details provided.</span>

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

// --- COMPONENT: DISPATCH MODAL ---
function DispatchModal({ onClose, onDispatch }: { onClose: () => void, onDispatch: (details: any) => void }) {
    const [priority, setPriority] = useState('normal')
    const [tech, setTech] = useState('')
    const [address, setAddress] = useState('')
    const [issue, setIssue] = useState('')
    const [notes, setNotes] = useState('') 

    const handleSubmit = () => {
        if(!tech || !address || !issue) return;
        onDispatch({ priority, tech, address, issue, notes })
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
             <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden panel-bevel flex flex-col max-h-[90vh]">
                <div className="bg-muted/30 border-b border-border p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                           <Radio className="w-5 h-5 text-action-warning animate-pulse" /> New Dispatch
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <X className="w-6 h-6 text-muted-foreground" />
                    </button>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-3">
                        {['low', 'normal', 'urgent'].map((p) => (
                            <button 
                                key={p}
                                onClick={() => setPriority(p)}
                                className={`h-10 rounded border text-xs font-black uppercase tracking-wider transition-all ${
                                    priority === p 
                                    ? p === 'urgent' ? 'bg-destructive text-destructive-foreground border-destructive' : 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background hover:bg-muted border-border text-muted-foreground'
                                }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Target Address</label>
                            <input 
                                autoFocus
                                type="text" 
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="e.g. 505 Main St, Unit B"
                                className="w-full bg-muted/20 border border-border rounded p-3 text-sm font-mono text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/30"
                            />
                        </div>
                        
                        <div className="space-y-1">
                             <label className="text-[10px] font-bold text-muted-foreground uppercase">Technician Assignment</label>
                             <div className="grid grid-cols-1 gap-2">
                                {TEAM_MEMBERS.map(t => (
                                    <button 
                                        key={t.id}
                                        onClick={() => setTech(t.name)}
                                        className={`flex items-center justify-between p-3 rounded border text-left transition-all ${
                                            tech === t.name 
                                            ? 'bg-primary/10 border-primary text-foreground' 
                                            : 'bg-muted/10 border-border hover:bg-muted/20 text-muted-foreground'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${
                                                t.status === 'idle' ? 'bg-action-success' : 'bg-action-warning'
                                            }`} />
                                            <span className="text-sm font-bold font-mono">{t.name}</span>
                                        </div>
                                        <span className="text-[10px] uppercase opacity-70">{t.status}</span>
                                    </button>
                                ))}
                             </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Job Title (Short)</label>
                            <input 
                                type="text"
                                value={issue}
                                onChange={(e) => setIssue(e.target.value)}
                                placeholder="e.g. Leaking Water Heater"
                                className="w-full bg-muted/20 border border-border rounded p-3 text-sm font-mono text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/30"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Dispatcher Notes (Detailed)</label>
                            <textarea 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Gate codes, warnings, specific parts needed..."
                                className="w-full bg-muted/20 border border-border rounded p-3 text-sm font-mono text-foreground focus:outline-none focus:border-primary/50 h-24 resize-none placeholder:text-muted-foreground/30"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-border bg-muted/10">
                    <button 
                        onClick={handleSubmit}
                        disabled={!tech || !address || !issue}
                        className="w-full h-12 bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-black text-sm uppercase tracking-wide hover:brightness-110 transition-all panel-bevel flex items-center justify-center gap-2"
                    >
                        Transmit Order <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
             </div>
        </div>
    )
}

// --- COMPONENT: INVOICE REVIEW MODAL ---
function InvoiceReviewModal({ data, onClose, onSend }: { data: InvoiceData, onClose: () => void, onSend: () => void }) {
    
    // --- CALCULATIONS FOR PRINT INVOICE ---
    const subtotal = data.items.reduce((acc, item) => acc + (item.qty * item.price), 0);
    const taxRate = 0.05; // 5% GST for Alberta
    const taxAmount = subtotal * taxRate;
    const grandTotal = subtotal + taxAmount;
    
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const dueDate = new Date(today);
    // --- FIX: Removed 'const' keyword here ---
    dueDate.setDate(dueDate.getDate() + 14); // Net 14
    // ----------------------------------------
    const dueDateStr = dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // ACTION: PRINT TO PDF
    const handlePrint = () => {
        window.print()
    }

    // ACTION: APPROVE AND TEXT
    const handleSMS = () => {
        onSend();
        const phone = "555-0123" 
        const text = encodeURIComponent(data.sms)
        window.location.href = `sms:${phone}?&body=${text}`
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
            {/* PRINT STYLES INJECTION */}
            <style jsx global>{`
                @media print {
                    /* HIDE ALL SCREEN UI */
                    body * { visibility: hidden; }
                    #invoice-modal-content, .bg-background, header, aside { display: none !important; }

                    /* SHOW ONLY THE PRINT INVOICE */
                    #print-invoice-container, #print-invoice-container * { 
                        visibility: visible; 
                        display: block !important;
                    }
                    
                    /* PAGE LAYOUT */
                    #print-invoice-container {
                        position: fixed;
                        left: 0;
                        top: 0;
                        width: 100vw;
                        height: 100vh;
                        background: white;
                        color: black;
                        padding: 40px;
                        margin: 0;
                        z-index: 99999;
                    }
                    
                    /* TABLE STYLING FOR PRINT */
                    table { width: 100%; border-collapse: collapse; }
                    th { border-bottom: 2px solid #000; text-align: left; padding: 8px 0; }
                    td { border-bottom: 1px solid #eee; padding: 12px 0; }
                    .text-right { text-align: right; }
                    .font-bold { font-weight: 700; }
                }
            `}</style>

            {/* HIDDEN PRINT TEMPLATE */}
            <div id="print-invoice-container" className="hidden font-sans text-black">
                <div className="flex justify-between items-start mb-12">
                    <div className="w-1/2">
                        <h1 className="text-3xl font-bold uppercase tracking-wide text-black mb-2">Pro Plumbing Ops</h1>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            123 Industrial Way<br/>Lethbridge, AB T1K 3M4<br/>P: (403) 555-0199
                        </p>
                    </div>
                    <div className="w-1/2 text-right">
                        <h2 className="text-5xl font-light text-gray-300 mb-4">INVOICE</h2>
                        <div className="flex flex-col gap-1 text-sm">
                            <div className="flex justify-end gap-4"><span className="font-bold text-gray-500">Date:</span><span>{dateStr}</span></div>
                            <div className="flex justify-end gap-4"><span className="font-bold text-gray-500">Due:</span><span>{dueDateStr}</span></div>
                        </div>
                    </div>
                </div>

                <div className="mb-12 border-t border-gray-200 pt-8 flex justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Bill To</h3>
                        <p className="text-lg font-bold text-black">{data.customer}</p>
                        <p className="text-gray-600 whitespace-pre-wrap">{data.address}</p>
                    </div>
                </div>

                <div className="mb-8">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="text-xs font-black uppercase text-gray-500 pb-4">Description</th>
                                <th className="text-xs font-black uppercase text-gray-500 text-right pb-4 w-24">Qty</th>
                                <th className="text-xs font-black uppercase text-gray-500 text-right pb-4 w-32">Price</th>
                                <th className="text-xs font-black uppercase text-gray-500 text-right pb-4 w-32">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map((item, i) => (
                                <tr key={i}>
                                    <td className="text-sm font-medium text-gray-800">{item.desc}</td>
                                    <td className="text-sm text-gray-600 text-right">{item.qty}</td>
                                    <td className="text-sm text-gray-600 text-right">${item.price.toFixed(2)}</td>
                                    <td className="text-sm font-bold text-black text-right">${(item.qty * item.price).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={2} className="pt-4 text-right text-xs font-bold text-muted-foreground uppercase">Subtotal</td>
                                <td className="pt-4 text-right text-xl font-black text-action-success">${subtotal.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <div className="text-center text-xs text-gray-400 mt-auto pt-8">
                    <p>Thank you for your business.</p>
                </div>
            </div>

            {/* SCREEN UI */}
            <div id="invoice-modal-content" className="bg-card border border-border w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden panel-bevel flex flex-col max-h-[90vh]">
                
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
                    <button id="modal-close-btn" onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <X className="w-6 h-6 text-muted-foreground" />
                    </button>
                </div>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* Line Items */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-border pb-2">
                            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Billable Items</h3>
                            <button id="modal-edit-btn" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
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
                                    <td colSpan={2} className="pt-4 text-right text-xs font-bold text-muted-foreground uppercase">Subtotal</td>
                                    <td className="pt-4 text-right text-xl font-black text-action-success">${subtotal.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Job Notes */}
                    <div className="bg-muted/20 rounded-lg p-4 border border-border/50">
                         <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Technician Notes (Public)</h3>
                         <div className="text-sm text-foreground">
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
                <div id="modal-footer-actions" className="p-6 border-t border-border bg-muted/10 flex gap-4">
                    <button 
                        onClick={handlePrint}
                        className="flex-1 h-12 bg-card border border-border text-foreground rounded-lg font-bold text-sm uppercase tracking-wide hover:bg-muted transition-colors panel-bevel flex items-center justify-center gap-2"
                    >
                        <Printer className="w-4 h-4" />
                        Print Invoice
                    </button>
                    <button 
                        onClick={handleSMS} 
                        className="flex-[2] h-12 bg-action-success text-action-success-foreground rounded-lg font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 hover:brightness-110 transition-all panel-bevel active:scale-[0.98]"
                    >
                        <Send className="w-4 h-4" />
                        Approve & Text Client
                    </button>
                </div>

            </div>
        </div>
    )
}

// --- MAIN DASHBOARD COMPONENT ---
export default function CommandDashboard() {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null)
  const [showDispatch, setShowDispatch] = useState(false)
  const [feed, setFeed] = useState<LogEntry[]>([]) // <--- REPLACED INITIAL_FEED WITH EMPTY ARRAY
  
  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1)
  const LOGS_PER_PAGE = 5
  // Note: We use Math.max(1, ...) to prevent 0 pages if feed is empty
  const totalPages = Math.max(1, Math.ceil(feed.length / LOGS_PER_PAGE))
  const paginatedFeed = feed.slice((currentPage - 1) * LOGS_PER_PAGE, currentPage * LOGS_PER_PAGE)

  // --- NEW: MANAGER CONTROL FUNCTIONS ---
  
  // 1. Create a job in the REAL database (SUPABASE)
  const handleCreateDispatch = async (details: any) => {
      const newJob = {
        id: `JOB-${Math.floor(Math.random() * 10000)}`,
        assignee: details.tech,
        address: details.address,
        issue: details.issue, // Short Title
        notes: details.notes || "No dispatcher notes provided.", // Long Notes
        distance: "Calculating...", // Placeholder for GPS logic
        est_time: "15 min",
        priority: details.priority,
        status: 'pending',
        time_window: 'ASAP',
        last_updated: Date.now()
      }

      // SEND TO CLOUD (Supabase)
      const { error } = await supabase.from('jobs').insert(newJob)

      if (error) {
          alert("Dispatch Failed: " + error.message)
      } else {
          // Success! (Realtime listener will update the feed automatically)
          console.log("Job transmitted to field units via Satellite.")
      }
  }

  // 2. Erase completed jobs from the database (SUPABASE)
  const handlePurgeHistory = async () => {
    if(!confirm("COMMAND: Are you sure? This will delete ALL completed jobs from the database permanently.")) return;
    
    // Dexie Delete
    await db.jobs.where('status').equals('complete').delete()

    // Supabase Delete
    const { count, error } = await supabase
        .from('jobs')
        .delete({ count: 'exact' })
        .eq('status', 'complete')

    if (error) alert("Purge Failed: " + error.message)
    else alert(`COMMAND: Cleared ${count || 0} completed mission logs from the Cloud.`)
  }

  const handleInvoiceSent = () => {
      alert("Invoice Sent via SMS.")
  }

  // --- SYNC LOGIC (CONNECT TO SUPABASE) ---
  useEffect(() => {
    const fetchLiveFeed = async () => {
        // Fetch ALL jobs from Cloud
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .order('last_updated', { ascending: false })

        if (data) {
            // Transform Supabase rows into LogEntry format for the Feed
            const logs: LogEntry[] = data.map((job: any) => ({
                id: job.id,
                tech: job.assignee,
                time: new Date(job.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                // Logic: If completed, show as Invoice ready. If pending, show as Dispatch active.
                type: job.status === 'complete' ? 'invoice' : 'dispatch',
                content: job.status === 'complete' 
                    ? `Job Complete at ${job.address}. Notes: "${job.notes || 'No notes'}"`
                    : `Dispatch Active: ${job.issue} at ${job.address}`,
                status: job.status,
                // Mock Invoice Data generator (Since we don't store line items in DB yet)
                invoiceData: job.status === 'complete' ? {
                    customer: "Resident",
                    address: job.address,
                    items: [
                        { desc: "Service Call", qty: 1, price: 150.00 },
                        { desc: "Labor", qty: 1, price: 85.00 }
                    ],
                    total: 235.00,
                    notes: job.notes || "No notes recorded.",
                    sms: `Your service at ${job.address} is complete. Total: $235.00.`
                } : undefined
            }))
            setFeed(logs)
        }
    }

    fetchLiveFeed()

    // REALTIME LISTENER
    const channel = supabase
        .channel('dashboard-feed')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
            fetchLiveFeed()
        })
        .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="dark min-h-screen bg-background flex scanlines font-mono text-foreground overflow-hidden">
      
      {/* RENDER INVOICE MODAL */}
      {selectedInvoice && (
        <InvoiceReviewModal 
            data={selectedInvoice} 
            onClose={() => setSelectedInvoice(null)} 
            onSend={handleInvoiceSent}
        />
      )}

      {/* RENDER DISPATCH MODAL */}
      {showDispatch && (
          <DispatchModal 
            onClose={() => setShowDispatch(false)}
            onDispatch={handleCreateDispatch}
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
        
        {/* NEW: MANAGER TOOLS */}
        <div className="p-4 border-t border-border">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2 px-2">Manager Tools</span>
            <button 
                onClick={handlePurgeHistory}
                className="w-full flex items-center gap-2 px-4 py-3 text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/30 rounded-lg transition-all"
            >
                <Trash2 className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Purge Cloud History</span>
            </button>
        </div>
      </aside>

      {/* MAIN CONTENT GRID - LOCKED HEIGHT (No scrolling window) */}
      <main className="flex-1 flex flex-col relative h-[calc(100vh)] max-h-screen">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur flex items-center justify-between px-6 z-10 shrink-0">
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

        {/* Dashboard Grid - Fit to remaining height */}
        <div className="flex-1 p-6 grid grid-cols-12 grid-rows-[auto_1fr] gap-6 overflow-hidden">
            
            {/* KPI CARDS (Top Row - Fixed Height) */}
            <div className="col-span-12 grid grid-cols-4 gap-6 h-32 shrink-0">
                <div className="bg-card border border-border p-5 rounded-xl panel-bevel flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Daily Revenue</span>
                        <DollarSign className="w-4 h-4 text-action-success" />
                    </div>
                    {/* Mock Revenue Calc based on completed jobs */}
                    <div className="text-3xl font-black text-foreground">
                        ${feed.filter(f => f.status === 'complete').length * 250}
                    </div>
                    <div className="text-xs font-medium text-action-success mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> +12% vs avg
                    </div>
                </div>
                <div className="bg-card border border-border p-5 rounded-xl panel-bevel flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Jobs</span>
                        <Clock className="w-4 h-4 text-action-warning" />
                    </div>
                    <div className="text-3xl font-black text-foreground">{feed.filter(f => f.status === 'pending').length}</div>
                    <div className="text-xs font-medium text-muted-foreground mt-1">Pending Dispatch</div>
                </div>
                <div className="bg-card border border-border p-5 rounded-xl panel-bevel flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Completed</span>
                        <ClipboardList className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-3xl font-black text-foreground">{feed.filter(f => f.status === 'complete').length}</div>
                    <div className="text-xs font-medium text-primary mt-1">Jobs Today</div>
                </div>
                
                {/* DISPATCH ACTION CARD */}
                 <div className="bg-card border border-border p-5 rounded-xl panel-bevel relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute inset-0 bg-primary/5" />
                    <div className="relative z-10 flex flex-col h-full justify-center items-center text-center">
                        <span className="text-xs font-black text-primary uppercase tracking-widest mb-1">New Assignment</span>
                        <button 
                            onClick={() => setShowDispatch(true)}
                            className="w-full py-2 bg-primary text-primary-foreground font-bold uppercase text-sm rounded hover:bg-primary/90 transition-colors panel-bevel"
                        >
                            + Dispatch Job
                        </button>
                    </div>
                </div>
            </div>

            {/* LIVE MAP & UNITS (Main Area - Fills remaining height) */}
            <div className="col-span-8 flex flex-col h-full overflow-hidden">
                <div className="flex-1 bg-card border border-border rounded-xl panel-inset relative overflow-hidden">
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

            {/* INCOMING FEED (Right Panel - Fills remaining height) */}
            <div className="col-span-4 bg-card border border-border rounded-xl panel-bevel flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center shrink-0">
                    <h2 className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                        Activity Log
                    </h2>
                    <span className="text-[10px] font-bold text-muted-foreground">LIVE</span>
                </div>
                
                {/* Feed List (Paginated) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {feed.length === 0 && (
                        <div className="text-center p-8 opacity-50">
                            <p className="text-xs font-bold uppercase">No activity recorded.</p>
                        </div>
                    )}

                    {paginatedFeed.map((log) => (
                        <div key={log.id} className="group relative bg-background border border-border rounded-lg p-3 transition-all hover:border-primary/50 animate-in slide-in-from-right-2 duration-300">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                                    log.type === 'invoice' ? 'bg-action-success/10 text-action-success' :
                                    log.type === 'alert' ? 'bg-destructive/10 text-destructive animate-pulse' :
                                    log.type === 'dispatch' ? 'bg-primary/10 text-primary' :
                                    'bg-muted/50 text-muted-foreground'
                                }`}>
                                    {log.type}
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground">{log.time}</span>
                            </div>
                            
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

                {/* PAGINATION CONTROLS */}
                <div className="p-3 border-t border-border bg-muted/10 flex items-center justify-between shrink-0">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Page {currentPage} of {totalPages}
                      </span>

                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                </div>

            </div>

        </div>
      </main>
    </div>
  )
}