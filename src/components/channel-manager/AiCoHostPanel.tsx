import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, Lightning01, MessageDotsCircle, Microphone01, Send03, Stars01, Trash01, XClose, Zap, Edit03, ChevronRight } from '@untitled-ui/icons-react'
import { cn } from '@/lib/cn'
import { reservationRows } from './ReservationListPage'

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'chat' | 'automate' | 'activity'
type DrawerPhase = 'describe' | 'processing' | 'review'
type ApprovalMode = 'suggest_only' | 'user_approves' | 'auto_apply'

export type AutomationStructure = {
  goal: string; trigger: string; scope: string
  contextInputs: string; decisionLogic: string; actions: string
  constraints: string; approvalMode: ApprovalMode; successMetric: string
}

export type SavedAutomation = {
  id: string; title: string; description: string
  structure: AutomationStructure; active: boolean; createdAt: number
}

export type ActivityItem = {
  id: string; automationTitle: string
  action: string; status: 'pending' | 'done' | 'dismissed'; createdAt: number
}

type ChatMessage = {
  id: string; role: 'user' | 'assistant'; content: string; streaming?: boolean
}

export type CalendarAiActions = {
  jumpToToday: () => void; goToNextMonth: () => void
  focusListingSearch: () => void; hintCreateReservation: () => void; hintOwnerStay: () => void
}

export type CalendarAiContext = { visibleRangeDescription: string }

export type AiPanelState = { pendingCount: number; hasActiveAutomation: boolean }

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'ai-cohost-v4'
const DEMO_ACTIVITY: ActivityItem[] = [
  { id: 'act-demo-1', automationTitle: 'Orphan Night Optimizer', action: 'Found 2 orphan nights on Apartment — Austin (Apr 28–29). Suggesting 10% price reduction to attract last-minute bookings.', status: 'pending', createdAt: Date.now() - 3_600_000 },
  { id: 'act-demo-2', automationTitle: 'Pre Check-in Messenger', action: 'Sent check-in instructions to 3 guests arriving in the next 48 hours across Loft — Portland, House — Denver.', status: 'done', createdAt: Date.now() - 7_200_000 },
]

function loadState(): { automations: SavedAutomation[]; activity: ActivityItem[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { automations: [], activity: DEMO_ACTIVITY }
    return JSON.parse(raw)
  } catch { return { automations: [], activity: DEMO_ACTIVITY } }
}
function saveState(a: SavedAutomation[], act: ActivityItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ automations: a, activity: act })) } catch {}
}

// ─── Calendar context ─────────────────────────────────────────────────────────

const LISTINGS = ['Apartment — Austin','Loft — Portland','House — Denver','Studio — Miami','Villa — Seattle','Cabin — Chicago','Apartment — Boston','Loft — Nashville']

function buildCalendarContext(): string {
  const today = new Date()
  const rows = reservationRows.slice(0, 80)
  const upcoming = rows.filter(r => new Date(r.checkIn) >= today)
  const now = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const summaries = LISTINGS.map(name => {
    const short = name.split(' — ')[1] ?? name
    const res = upcoming.filter(r => r.listingName.toLowerCase().includes(short.toLowerCase()))
    const avgRate = res.length > 0 ? Math.round(res.reduce((s, r) => s + (900 + (parseInt(r.id.replace('res-','')) % 8) * 150), 0) / res.length / (res[0]?.nights ?? 1)) : 0
    return `• ${name}: ${res.length} upcoming, avg $${avgRate}/night`
  }).join('\n')
  return `Today: ${now}\n\nLISTINGS:\n${summaries}\nTotal upcoming: ${upcoming.length}`
}

// ─── Smart local fallbacks ─────────────────────────────────────────────────────

function localChatResponse(msg: string): string {
  const t = msg.toLowerCase()
  const rows = reservationRows.slice(0, 80)
  const today = new Date()
  const upcoming = rows.filter(r => new Date(r.checkIn) >= today)
  if (/orphan|gap|single|1.night|2.night/.test(t))
    return `Found ${Math.floor(Math.random()*4)+2} potential orphan nights in the next 14 days:\n\n• Apartment — Austin: Apr 28–29 (1-night gap)\n• Loft — Portland: May 3 (single night)\n• House — Denver: May 7–8 (2-night gap)\n\nConsider lowering prices 10–15% on those nights.`
  if (/availab|free|open|empty/.test(t))
    return `Next 30 days across ${LISTINGS.length} listings:\n\n• ${Math.floor(Math.random()*3)+3} listings have availability next weekend\n• Most available: Studio — Miami (12 nights), Cabin — Chicago (9 nights)\n• Fully booked next 14 days: Loft — Portland, House — Denver`
  if (/occupanc|booked|fill/.test(t)) {
    const rate = 68 + Math.floor(Math.random() * 15)
    return `Occupancy next 30 days: **${rate}%** across all listings.\n\n• Top: Loft — Nashville (${rate+12}%)\n• Needs attention: Studio — San Diego (${rate-18}%)`
  }
  if (/check.?in|arriving/.test(t)) {
    const checkIns = upcoming.filter(r => { const d=(new Date(r.checkIn).getTime()-today.getTime())/86400000; return d>=0&&d<=7 }).slice(0,4)
    if (!checkIns.length) return 'No check-ins in the next 7 days based on current demo data.'
    return `${checkIns.length} guests checking in this week:\n\n${checkIns.map(r=>`• ${r.guestName} → ${r.listingName.split(' ')[0]} (${r.checkIn})`).join('\n')}`
  }
  if (/price|rate|revenue/.test(t)) {
    const total = upcoming.slice(0,20).reduce((s,r)=>s+(900+(parseInt(r.id.replace('res-',''))%8)*150),0)
    return `Projected revenue next 30 days: **$${total.toLocaleString()}** across ${upcoming.slice(0,20).length} reservations.\n\n• Avg nightly rate: $${Math.round(total/upcoming.slice(0,20).reduce((s,r)=>s+r.nights,0))}\n• Pricing opportunity on 3 listings below market avg`
  }
  if (/today|jump/.test(t)) return 'Jumped to today on the calendar.'
  if (/automate|workflow/.test(t)) return 'Switch to the **Automate** tab to set up intelligent workflows — orphan night pricing, pre check-in messages, gap detection, and more.'
  if (/hi|hello|hey/.test(t)) return 'Hi! Ask me:\n\n• "Any orphan nights this week?"\n• "What\'s my occupancy next month?"\n• "Who\'s checking in this weekend?"\n• "How\'s revenue looking?"'
  return `Analyzed your calendar: ${upcoming.length} upcoming reservations across ${LISTINGS.length} listings. Your busiest upcoming period is ${upcoming[0]?.checkIn ?? 'this week'}. Ask about availability, occupancy, check-ins, or pricing.`
}

function localParseWorkflow(d: string): AutomationStructure {
  const t = d.toLowerCase()
  const isPricing = /pric|rate|lower|higher|adjust/.test(t)
  const isMessage = /message|notify|send|email|remind|alert/.test(t)
  const isSchedule = /morning|evening|daily|every day/.test(t)
  const hasMoney = /\$|\d+%/.test(d)
  return {
    goal: d.length > 90 ? d.slice(0,87)+'…' : d,
    trigger: isSchedule ? 'Every morning at 8:00 AM' : isPricing ? 'When qualifying dates are identified' : 'When a reservation event occurs',
    scope: /all listing|every property/.test(t) ? 'All active listings' : 'Listings matching current filter',
    contextInputs: isPricing ? 'Reservation calendar, current nightly rates, minimum price rules' : 'Reservation calendar, guest data, upcoming check-ins',
    decisionLogic: isPricing ? 'Identify gap nights, compare current rate against optimal for occupancy' : isMessage ? 'Check trigger condition is met, verify guest data is complete' : 'Scan calendar for the described condition, flag matches',
    actions: isPricing ? '1. Identify affected dates\n2. Prepare price adjustment\n3. Notify you for approval' : isMessage ? '1. Check trigger condition\n2. Personalise message with guest details\n3. Send via preferred channel' : '1. Scan for matching conditions\n2. Compile findings\n3. Present for your review',
    constraints: 'Never go below minimum price threshold. Never modify confirmed reservations. Notify you before any guest-facing changes.',
    approvalMode: hasMoney||isPricing ? 'user_approves' : isMessage ? 'auto_apply' : 'suggest_only',
    successMetric: isPricing ? 'Increase in occupancy on previously-empty nights within 14 days' : isMessage ? 'Reduction in manual messaging time per week' : 'Time saved on manual calendar review per day',
  }
}

// ─── API helpers ──────────────────────────────────────────────────────────────

const CHAT_SYS = (ctx: string) => `You are AI Co-Host for a vacation rental manager.\n\n${ctx}\n\nAnswer concisely (3-5 sentences), reference actual listing names. Use bullet points for lists.`
const WF_SYS = `Extract the user's workflow into JSON with 9 fields: goal, trigger, scope, contextInputs, decisionLogic, actions, constraints, approvalMode (exactly "suggest_only"|"user_approves"|"auto_apply"), successMetric. Return ONLY valid JSON.`

async function streamChat(history: {role:string;content:string}[], ctx: string, onToken:(t:string)=>void, onDone:()=>void) {
  const lastUser = [...history].reverse().find(m=>m.role==='user')?.content??''
  try {
    const res = await fetch('/api/claude/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:800,stream:true,system:CHAT_SYS(ctx),messages:history})})
    if (!res.ok) throw new Error()
    const reader=res.body!.getReader(); const dec=new TextDecoder(); let buf=''
    while(true){const{done,value}=await reader.read();if(done)break;buf+=dec.decode(value,{stream:true});const lines=buf.split('\n');buf=lines.pop()??'';for(const l of lines){if(!l.startsWith('data: '))continue;const d=l.slice(6);if(d==='[DONE]'){onDone();return}try{const j=JSON.parse(d);if(j.type==='content_block_delta'&&j.delta?.type==='text_delta')onToken(j.delta.text)}catch{}}}
    onDone()
  } catch {
    const reply=localChatResponse(lastUser); let i=0
    const iv=setInterval(()=>{if(i>=reply.length){clearInterval(iv);onDone();return}onToken(reply[i]!);i++},14)
  }
}

async function parseWorkflow(desc: string): Promise<AutomationStructure> {
  try {
    const res=await fetch('/api/claude/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:1024,stream:false,system:WF_SYS,messages:[{role:'user',content:desc}]})})
    if(!res.ok) throw new Error()
    const data=await res.json()
    return JSON.parse(data.content[0].text) as AutomationStructure
  } catch { return localParseWorkflow(desc) }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TEMPLATES = [
  "When there's an orphan night (1-2 night gap), lower price by 10%",
  "Send check-in instructions 24hrs before each arrival",
  "Alert me when 3+ nights are open in the next 14 days",
  "Raise minimum nights on weekends with high demand",
  "Lower prices on last-minute availability (3 days out)",
  "Notify me when a reservation is cancelled",
]

const FIELD_META: { key: keyof AutomationStructure; icon: string; label: string; placeholder: string }[] = [
  { key: 'goal',          icon: '🎯', label: 'Goal',           placeholder: 'What do you want to achieve?' },
  { key: 'trigger',       icon: '⚡', label: 'Trigger',        placeholder: 'What starts this automation?' },
  { key: 'scope',         icon: '📍', label: 'Scope',          placeholder: 'Which listings or dates apply?' },
  { key: 'contextInputs', icon: '🔍', label: 'Context',        placeholder: 'What data should AI check first?' },
  { key: 'decisionLogic', icon: '🧠', label: 'Decision logic', placeholder: 'How does AI decide what to do?' },
  { key: 'actions',       icon: '⚙️', label: 'Actions',        placeholder: 'What will AI do?' },
  { key: 'constraints',   icon: '🛡️', label: 'Guardrails',    placeholder: 'What must AI never do?' },
  { key: 'successMetric', icon: '📊', label: 'Success metric', placeholder: 'How do we measure success?' },
]

const APPROVAL_OPTIONS: { value: ApprovalMode; label: string; desc: string }[] = [
  { value: 'suggest_only',  label: 'Suggest only', desc: 'AI shows ideas, you decide' },
  { value: 'user_approves', label: 'I approve',    desc: 'AI prepares, you confirm' },
  { value: 'auto_apply',    label: 'Auto-apply',   desc: 'AI acts within set limits' },
]

// ─── AutomationDrawer ─────────────────────────────────────────────────────────

function AutomationDrawer({
  open, onClose, editTarget, onSave, onDelete,
}: {
  open: boolean
  onClose: () => void
  editTarget: SavedAutomation | null   // null = create
  onSave: (a: SavedAutomation) => void
  onDelete?: (id: string) => void
}) {
  const [phase, setPhase] = useState<DrawerPhase>('describe')
  const [description, setDescription] = useState('')
  const [structure, setStructure] = useState<AutomationStructure | null>(null)
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>('suggest_only')
  const [showTemplates, setShowTemplates] = useState(false)
  const drawerScrollRef = useRef<HTMLDivElement>(null)

  // Scroll to top whenever the phase changes
  useEffect(() => {
    requestAnimationFrame(() => { if (drawerScrollRef.current) drawerScrollRef.current.scrollTop = 0 })
  }, [phase])

  // Reset when drawer opens/closes or target changes
  useEffect(() => {
    if (open) {
      if (editTarget) {
        setDescription(editTarget.description)
        setStructure(editTarget.structure)
        setApprovalMode(editTarget.structure.approvalMode)
        setPhase('review')
      } else {
        setDescription(''); setStructure(null); setApprovalMode('suggest_only'); setPhase('describe')
      }
      setShowTemplates(false)
    }
  }, [open, editTarget])

  const runParse = useCallback(async () => {
    if (!description.trim()) return
    setPhase('processing')
    const s = await parseWorkflow(description)
    setStructure(s); setApprovalMode(s.approvalMode); setPhase('review')
  }, [description])

  const handleActivate = useCallback(() => {
    if (!structure) return
    const final = { ...structure, approvalMode }
    const saved: SavedAutomation = editTarget
      ? { ...editTarget, description, structure: final }
      : { id: `auto-${Date.now()}`, title: final.goal.slice(0, 60), description, structure: final, active: true, createdAt: Date.now() }
    onSave(saved)
    onClose()
  }, [structure, approvalMode, description, editTarget, onSave, onClose])

  const updateField = (key: keyof AutomationStructure, val: string) => {
    setStructure(prev => prev ? { ...prev, [key]: val } : null)
  }

  if (!open) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[500]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-[#0d1117]/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            className="absolute right-0 top-0 bottom-0 flex w-[480px] flex-col bg-white shadow-[−8px_0_40px_rgba(10,13,18,0.15)]"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          >
            {/* Header */}
            <div className="flex h-[56px] shrink-0 items-center gap-3 border-b border-[#e9eaeb] px-5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#fff7ed]">
                <Stars01 width={16} height={16} className="text-[#f97316]" aria-hidden />
              </div>
              <h2 className="flex-1 text-[15px] font-semibold text-[#181d27]">
                {editTarget ? 'Edit automation' : 'Create automation'}
              </h2>
              <button type="button" onClick={onClose}
                className="flex size-8 items-center justify-center rounded-md text-[#9aa3af] hover:bg-[#f5f5f5] transition-colors"
              >
                <XClose width={18} height={18} aria-hidden />
              </button>
            </div>

            {/* Content */}
            <div ref={drawerScrollRef} className="min-h-0 flex-1 overflow-y-auto">
              <AnimatePresence mode="wait" initial={false}>

                {/* Phase: describe */}
                {phase === 'describe' && (
                  <motion.div key="describe" className="flex flex-col gap-5 p-5"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-[#181d27]">
                        What do you want to automate?
                      </label>
                      <p className="mb-3 text-[12px] leading-relaxed text-[#717680]">
                        Describe in plain language — AI will structure it into a clear automation plan.
                      </p>
                      <div className="relative rounded-xl border border-[#e9eaeb] bg-[#fafafa] transition-all focus-within:border-[#f97316]/60 focus-within:ring-2 focus-within:ring-[#f97316]/12">
                        <textarea value={description} onChange={e => setDescription(e.target.value)}
                          rows={5}
                          placeholder={'e.g. When I have orphan nights (1–2 night gaps), lower the nightly price by 10% and notify me so I can confirm before it goes live.'}
                          className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-[13px] leading-relaxed text-[#181d27] placeholder:text-[#9aa3af] focus:outline-none"
                        />
                        <div className="flex items-center justify-between px-3 pb-3">
                          <button type="button" onClick={() => setShowTemplates(true)}
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[#717680] hover:bg-[#f0f0f0] hover:text-[#414651] transition-colors"
                          >
                            Browse templates
                            <ChevronRight width={14} height={14} aria-hidden />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Templates overlay */}
                    <AnimatePresence>
                      {showTemplates && (
                        <motion.div
                          className="absolute inset-x-5 rounded-xl border border-[#e9eaeb] bg-white shadow-[0px_8px_24px_rgba(10,13,18,0.12)] z-10"
                          style={{ top: 120 }}
                          initial={{ opacity: 0, y: -8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                        >
                          <div className="flex items-center justify-between border-b border-[#f0f2f5] px-4 py-3">
                            <p className="text-[12px] font-semibold text-[#181d27]">Quick start templates</p>
                            <button type="button" onClick={() => setShowTemplates(false)}
                              className="text-[#9aa3af] hover:text-[#414651]"
                            >
                              <XClose width={16} height={16} aria-hidden />
                            </button>
                          </div>
                          <div className="p-2">
                            {TEMPLATES.map(t => (
                              <button key={t} type="button"
                                onClick={() => { setDescription(t); setShowTemplates(false) }}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] text-[#181d27] hover:bg-[#f8fafc] transition-colors"
                              >
                                <Zap width={14} height={14} className="shrink-0 text-[#f97316]" aria-hidden />
                                {t}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Phase: processing */}
                {phase === 'processing' && (
                  <motion.div key="processing"
                    className="flex min-h-[360px] flex-col items-center justify-center gap-4"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <div className="relative flex items-center justify-center">
                      <motion.div className="absolute size-16 rounded-full bg-[#f97316]/10"
                        animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                      />
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                        <Stars01 width={32} height={32} className="text-[#f97316]" />
                      </motion.div>
                    </div>
                    <div className="text-center">
                      <p className="text-[14px] font-semibold text-[#181d27]">Building your automation</p>
                      <motion.p className="mt-1 text-[12px] text-[#717680]"
                        animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        AI is structuring your workflow…
                      </motion.p>
                    </div>
                  </motion.div>
                )}

                {/* Phase: review — fully editable */}
                {phase === 'review' && structure && (
                  <motion.div key="review" className="flex flex-col gap-5 p-5"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle width={16} height={16} className="text-[#15b8b0]" aria-hidden />
                      <p className="text-[13px] font-semibold text-[#181d27]">
                        Review and edit your automation plan
                      </p>
                    </div>

                    {/* Editable fields */}
                    <div className="space-y-3">
                      {FIELD_META.map(f => (
                        <div key={f.key} className="rounded-xl border border-[#e9eaeb] bg-white overflow-hidden focus-within:border-[#15b8b0]/50 focus-within:ring-1 focus-within:ring-[#15b8b0]/20 transition-all">
                          <div className="flex items-center gap-2 border-b border-[#f5f6f7] bg-[#fafafa] px-3 py-1.5">
                            <span className="text-[12px]" aria-hidden>{f.icon}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">{f.label}</span>
                          </div>
                          <textarea
                            value={structure[f.key] as string}
                            onChange={e => updateField(f.key, e.target.value)}
                            placeholder={f.placeholder}
                            rows={2}
                            className="w-full resize-none bg-transparent px-3 py-2 text-[13px] leading-relaxed text-[#181d27] placeholder:text-[#c1c7d0] focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Approval mode — design-system radio cards */}
                    <div>
                      <p className="mb-2.5 text-[13px] font-semibold text-[#181d27]">How autonomous should this be?</p>
                      <div className="space-y-2">
                        {APPROVAL_OPTIONS.map(opt => {
                          const selected = approvalMode === opt.value
                          return (
                            <label key={opt.value}
                              className={cn(
                                'flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-all',
                                selected ? 'border-[#15b8b0] bg-[#f0fdf9]' : 'border-[#e9eaeb] bg-white hover:border-[#15b8b0]/40 hover:bg-[#fafafa]',
                              )}
                            >
                              {/* Radio dot */}
                              <span className={cn(
                                'flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                                selected ? 'border-[#15b8b0]' : 'border-[#d1d5db]',
                              )}>
                                {selected && <span className="size-2 rounded-full bg-[#15b8b0]" />}
                              </span>
                              <input type="radio" className="sr-only" checked={selected} onChange={() => setApprovalMode(opt.value)} />
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-semibold text-[#181d27]">{opt.label}</p>
                                <p className="text-[12px] text-[#717680]">{opt.desc}</p>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer actions — right-aligned, natural width, never stretched */}
            <div className="shrink-0 border-t border-[#e9eaeb] bg-white px-5 py-3.5">
              {phase === 'describe' ? (
                <div className="flex items-center justify-between gap-3">
                  <button type="button" onClick={onClose}
                    className="text-[13px] font-medium text-[#717680] hover:text-[#414651] transition-colors"
                  >
                    Cancel
                  </button>
                  <button type="button" onClick={runParse} disabled={!description.trim()}
                    className={cn(
                      'flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-colors',
                      description.trim()
                        ? 'bg-[#181d27] text-white hover:bg-[#0d1117]'
                        : 'bg-[#f2f4f7] text-[#9aa3af] cursor-not-allowed',
                    )}
                  >
                    <Stars01 width={14} height={14} aria-hidden />
                    Generate plan
                  </button>
                </div>
              ) : phase === 'review' ? (
                <div className="flex items-center justify-between gap-3">
                  {/* Left side: delete (edit mode only) or back link (create mode) */}
                  {editTarget && onDelete ? (
                    <button type="button"
                      onClick={() => { onDelete(editTarget.id); onClose() }}
                      className="flex items-center gap-1.5 rounded-lg border border-[#fecdca] px-3 py-2 text-[12px] font-medium text-[#b42318] hover:bg-[#fef3f2] transition-colors"
                      aria-label="Delete automation"
                    >
                      <Trash01 width={13} height={13} aria-hidden />
                      Delete
                    </button>
                  ) : (
                    <button type="button"
                      onClick={() => setPhase('describe')}
                      className="flex items-center gap-1 text-[13px] font-medium text-[#717680] hover:text-[#414651] transition-colors"
                    >
                      <Edit03 width={13} height={13} aria-hidden />
                      Edit description
                    </button>
                  )}
                  <button type="button" onClick={handleActivate}
                    className="flex items-center gap-1.5 rounded-xl bg-[#181d27] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#0d1117] transition-colors"
                  >
                    <Lightning01 width={14} height={14} aria-hidden />
                    {editTarget ? 'Save changes' : 'Activate'}
                  </button>
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AiCoHostPanel({
  onClose, calendarActions, calendarContext, onStateChange,
}: {
  onClose: () => void
  calendarActions: CalendarAiActions
  calendarContext: CalendarAiContext
  onStateChange?: (s: AiPanelState) => void
}) {
  const [tab, setTab] = useState<TabId>('chat')
  const [{ automations, activity }, setData] = useState(() => loadState())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTarget, setDrawerTarget] = useState<SavedAutomation | null>(null)

  useEffect(() => {
    saveState(automations, activity)
    onStateChange?.({ pendingCount: activity.filter(a => a.status === 'pending').length, hasActiveAutomation: automations.some(a => a.active) })
  }, [automations, activity, onStateChange])

  // ── Chat ──
  const calCtx = useMemo(() => buildCalendarContext(), [])
  const scrollRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome', role: 'assistant',
    content: `Hi — I'm AI Co-Host. I have access to your calendar data for ${calendarContext.visibleRangeDescription}.\n\nAsk me anything: availability gaps, occupancy rates, upcoming check-ins, or what to optimize.`,
  }])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  // ── Voice state (declared early so sendChat can ref it) ──
  type VoiceState = 'idle' | 'listening' | 'processing'
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const voiceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const voiceQueryIndexRef = useRef(0)
  const VOICE_QUERIES = [
    'Any orphan nights this week?',
    "What's my occupancy for May?",
    'Who is checking in this weekend?',
    "How's revenue looking this month?",
    'Which listings have availability next weekend?',
  ]

  useEffect(() => () => { if (voiceTimerRef.current) clearTimeout(voiceTimerRef.current) }, [])
  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight }, [messages])

  const sendChat = useCallback((text: string) => {
    const t = text.trim()
    if (!t || chatLoading) return
    const aId = `a-${Date.now()}`
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: t }, { id: aId, role: 'assistant', content: '', streaming: true }])
    setChatInput('')
    setChatLoading(true)
    if (/jump|today/.test(t.toLowerCase())) calendarActions.jumpToToday()
    if (/next month/.test(t.toLowerCase())) calendarActions.goToNextMonth()
    const history = messages.filter(m => !m.streaming).concat([{ id: 'x', role: 'user', content: t }]).map(m => ({ role: m.role, content: m.content }))
    streamChat(history, calCtx,
      token => setMessages(prev => prev.map(m => m.id === aId ? { ...m, content: m.content + token } : m)),
      () => { setChatLoading(false); setMessages(prev => prev.map(m => m.id === aId ? { ...m, streaming: false } : m)) },
    )
  }, [chatLoading, messages, calCtx, calendarActions])

  const startVoiceCommand = useCallback(() => {
    if (voiceState !== 'idle' || chatLoading) return
    setVoiceState('listening')
    voiceTimerRef.current = setTimeout(() => {
      setVoiceState('processing')
      const query = VOICE_QUERIES[voiceQueryIndexRef.current % VOICE_QUERIES.length]!
      voiceQueryIndexRef.current++
      voiceTimerRef.current = setTimeout(() => {
        setVoiceState('idle')
        sendChat(query)
      }, 900)
    }, 1800)
  }, [voiceState, chatLoading, sendChat, VOICE_QUERIES])

  // ── Automation handlers ──
  const openCreateDrawer = () => { setDrawerTarget(null); setDrawerOpen(true) }
  const openEditDrawer = (a: SavedAutomation) => { setDrawerTarget(a); setDrawerOpen(true) }

  const saveAutomation = useCallback((saved: SavedAutomation) => {
    const demoActivity: ActivityItem = {
      id: `act-${Date.now()}`, automationTitle: saved.title,
      action: `Automation ${drawerTarget ? 'updated' : 'activated'}. First scan scheduled: "${saved.structure.trigger}"`,
      status: 'done', createdAt: Date.now(),
    }
    setData(prev => ({
      automations: drawerTarget
        ? prev.automations.map(a => a.id === saved.id ? saved : a)
        : [saved, ...prev.automations],
      activity: [demoActivity, ...prev.activity],
    }))
  }, [drawerTarget])

  const deleteAutomation = useCallback((id: string) => {
    setData(prev => ({ ...prev, automations: prev.automations.filter(a => a.id !== id) }))
  }, [])

  const toggleAutomation = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setData(prev => ({ ...prev, automations: prev.automations.map(a => a.id === id ? { ...a, active: !a.active } : a) }))
  }, [])

  const pendingCount = activity.filter(a => a.status === 'pending').length

  const resolveActivity = useCallback((id: string, status: 'done' | 'dismissed') => {
    setData(prev => ({ ...prev, activity: prev.activity.map(a => a.id === id ? { ...a, status } : a) }))
  }, [])

  const tabs: { id: TabId; label: string; badge?: number }[] = [
    { id: 'chat', label: 'Chat' },
    { id: 'automate', label: 'Automate' },
    { id: 'activity', label: 'Activity', badge: pendingCount || undefined },
  ]

  return (
    <>
      <AutomationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} editTarget={drawerTarget} onSave={saveAutomation} onDelete={deleteAutomation} />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-[52px] shrink-0 items-center gap-2 border-b border-[#e9eaeb] px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Stars01 width={20} height={20} className="shrink-0 text-[#f97316]" aria-hidden />
            <h2 className="truncate text-[15px] font-semibold text-[#181d27]">Copilot</h2>
          </div>
          <button type="button" onClick={onClose}
            className="flex size-8 items-center justify-center rounded-md text-[#98a2b3] hover:bg-[#f6f9fc] transition-colors"
          >
            <XClose width={18} height={18} aria-hidden />
          </button>
        </header>

        {/* Tabs */}
        <div className="flex shrink-0 gap-0 border-b border-[#e9eaeb] px-4">
          {tabs.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={cn(
                'relative mr-4 flex items-center gap-1.5 border-b-2 pb-2.5 pt-2.5 text-[13px] font-medium transition-colors',
                tab === t.id ? 'border-[#15b8b0] text-[#107569]' : 'border-transparent text-[#717680] hover:text-[#414651]',
              )}
            >
              {t.label}
              {t.badge ? (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#f04438] px-1 text-[10px] font-bold text-white">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <AnimatePresence mode="wait" initial={false}>
          {/* ── CHAT ── */}
          {tab === 'chat' && (
            <motion.div key="chat" className="flex min-h-0 flex-1 flex-col"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
            >
              <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map(m => (
                  <div key={m.id} className={cn('flex gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {m.role === 'assistant' && (
                      <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#fff7ed]">
                        <Stars01 width={12} height={12} className="text-[#f97316]" aria-hidden />
                      </div>
                    )}
                    <div className={cn(
                      'max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-[1.55]',
                      m.role === 'user' ? 'rounded-br-md bg-[#f0fdf9] text-[#107569]' : 'rounded-bl-md bg-[#f8f9fa] text-[#181d27]',
                    )}>
                      {m.streaming && !m.content ? (
                        <span className="flex gap-1">
                          {[0,0.2,0.4].map(d => (
                            <motion.span key={d} className="size-1.5 rounded-full bg-[#98a2b3]"
                              animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 1, repeat: Infinity, delay: d }} />
                          ))}
                        </span>
                      ) : <span style={{ whiteSpace: 'pre-wrap' }}>{m.content}</span>}
                    </div>
                  </div>
                ))}
              </div>
              {/* Voice listening overlay */}
              <AnimatePresence>
                {voiceState !== 'idle' && (
                  <motion.div
                    className="shrink-0 border-t border-[#e9eaeb] bg-white p-3"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="flex items-center gap-3 rounded-xl border border-[#e9eaeb] bg-[#fafafa] px-4 py-3">
                      {/* Pulsing mic */}
                      <div className="relative flex size-8 shrink-0 items-center justify-center">
                        {voiceState === 'listening' && (
                          <motion.span className="absolute inset-0 rounded-full bg-[#f04438]/20"
                            animate={{ scale: [1, 1.8, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                        )}
                        <Microphone01 width={16} height={16}
                          className={voiceState === 'listening' ? 'text-[#f04438]' : 'text-[#9aa3af]'}
                          aria-hidden />
                      </div>
                      {/* Waveform bars */}
                      <div className="flex flex-1 items-center gap-[3px]">
                        {Array.from({ length: 18 }, (_, i) => (
                          <motion.span key={i}
                            className={cn('w-[2px] rounded-full', voiceState === 'listening' ? 'bg-[#f04438]' : 'bg-[#d1d5db]')}
                            animate={voiceState === 'listening' ? {
                              height: ['4px', `${8 + Math.sin(i) * 10 + Math.random() * 8}px`, '4px'],
                            } : { height: '4px' }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.04, ease: 'easeInOut' }}
                          />
                        ))}
                      </div>
                      <p className="shrink-0 text-[12px] text-[#9aa3af]">
                        {voiceState === 'listening' ? 'Listening…' : 'Processing…'}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {voiceState === 'idle' && (
                <form onSubmit={e => { e.preventDefault(); sendChat(chatInput) }}
                  className="shrink-0 border-t border-[#e9eaeb] p-3"
                >
                  <div className="flex items-end gap-2 rounded-xl border border-[#e9eaeb] px-3 py-2.5 focus-within:border-[#15b8b0] focus-within:ring-2 focus-within:ring-[#15b8b0]/15 transition-all">
                    <textarea value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(chatInput) } }}
                      rows={2} disabled={chatLoading}
                      placeholder="Ask about your calendar…"
                      className="min-h-0 flex-1 resize-none bg-transparent text-[13px] text-[#181d27] placeholder:text-[#9aa3af] focus:outline-none"
                    />
                    <div className="flex shrink-0 items-center gap-1">
                      {/* Voice command button */}
                      <button type="button" onClick={startVoiceCommand} disabled={chatLoading}
                        className="flex size-8 items-center justify-center rounded-lg text-[#9aa3af] hover:bg-[#f5f5f5] hover:text-[#414651] transition-colors"
                        aria-label="Voice input"
                        title="Voice input"
                      >
                        <Microphone01 width={16} height={16} aria-hidden />
                      </button>
                      <button type="submit" disabled={!chatInput.trim() || chatLoading}
                        className={cn(
                          'flex size-8 items-center justify-center rounded-lg transition-colors',
                          chatInput.trim() && !chatLoading ? 'bg-[#15b8b0] text-white hover:bg-[#0f9a93]' : 'bg-[#f2f4f7] text-[#98a2b3]',
                        )}
                      >
                        <Send03 width={15} height={15} aria-hidden />
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          )}

          {/* ── AUTOMATE ── */}
          {tab === 'automate' && (
            <motion.div key="automate" className="flex min-h-0 flex-1 flex-col"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
            >
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                {/* Create button */}
                <button type="button" onClick={openCreateDrawer}
                  className="mb-5 flex w-full items-center justify-center rounded-xl bg-[#181d27] py-2.5 text-[13px] font-semibold text-white hover:bg-[#0d1117] transition-colors"
                >
                  Create automation
                </button>

                {/* Automations list */}
                {automations.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-[#fff7ed]">
                      <Zap width={20} height={20} className="text-[#f97316]" aria-hidden />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#181d27]">No automations yet</p>
                      <p className="mt-1 text-[12px] text-[#9aa3af]">Create one to let AI work for you in the background.</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">
                      Your automations
                    </p>
                    <div className="space-y-2">
                      {automations.map(a => (
                        <div key={a.id}
                          role="button" tabIndex={0}
                          onClick={() => openEditDrawer(a)}
                          onKeyDown={e => { if (e.key === 'Enter') openEditDrawer(a) }}
                          className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e9eaeb] bg-white px-3.5 py-3 transition-colors hover:border-[#d1d5db] hover:bg-[#fafafa]"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-[#181d27]">{a.title}</p>
                            <p className={cn('mt-0.5 text-[11px]', a.active ? 'text-[#15b8b0]' : 'text-[#9aa3af]')}>
                              {a.active ? 'Active — scanning' : 'Paused'}
                            </p>
                          </div>
                          {/* Design-system toggle — matches checkbox sizing, no shadow */}
                          <button
                            type="button"
                            onClick={e => toggleAutomation(a.id, e)}
                            role="switch"
                            aria-checked={a.active}
                            aria-label={a.active ? 'Deactivate automation' : 'Activate automation'}
                            className={cn(
                              'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15b8b0] focus-visible:ring-offset-1',
                              a.active ? 'bg-[#15b8b0]' : 'bg-[#d1d5db]',
                            )}
                          >
                            <span
                              className={cn(
                                'pointer-events-none inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white transition-transform duration-150',
                                a.active ? 'translate-x-[18px]' : 'translate-x-[2px]',
                              )}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── ACTIVITY ── */}
          {tab === 'activity' && (
            <motion.div key="activity" className="flex min-h-0 flex-1 flex-col"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
            >
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                {activity.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <MessageDotsCircle width={32} height={32} className="text-[#d1d5db]" aria-hidden />
                    <p className="text-[13px] text-[#9aa3af]">No activity yet.<br />Activate an automation to see AI work here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingCount > 0 && (
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#f04438]">
                        {pendingCount} awaiting your approval
                      </p>
                    )}
                    {activity.filter(a => a.status !== 'dismissed').map(item => (
                      <motion.div key={item.id} layout
                        className={cn(
                          'rounded-xl border p-3.5',
                          item.status === 'pending' ? 'border-[#fde68a] bg-[#fffbeb]' : 'border-[#e9eaeb] bg-white',
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={cn('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full', item.status === 'pending' ? 'bg-[#fde68a]' : 'bg-[#d1fae5]')}>
                            {item.status === 'pending'
                              ? <Zap width={11} height={11} className="text-[#d97706]" aria-hidden />
                              : <CheckCircle width={11} height={11} className="text-[#059669]" aria-hidden />
                            }
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-[#717680]">{item.automationTitle}</p>
                            <p className="mt-0.5 text-[12px] leading-relaxed text-[#181d27]">{item.action}</p>
                            <p className="mt-1 text-[10px] text-[#9aa3af]">
                              {new Date(item.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        {item.status === 'pending' && (
                          <div className="mt-2.5 flex gap-2">
                            <button type="button" onClick={() => resolveActivity(item.id, 'done')}
                              className="flex-1 rounded-lg bg-[#181d27] py-1.5 text-[12px] font-semibold text-white hover:bg-[#0d1117] transition-colors"
                            >Apply</button>
                            <button type="button" onClick={() => resolveActivity(item.id, 'dismissed')}
                              className="flex-1 rounded-lg border border-[#e9eaeb] bg-white py-1.5 text-[12px] font-medium text-[#414651] hover:bg-[#fafafa] transition-colors"
                            >Dismiss</button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
