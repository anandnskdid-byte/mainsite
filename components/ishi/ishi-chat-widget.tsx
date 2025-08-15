"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { database } from "@/lib/firebase"
import { ref, get, push, update } from "firebase/database"
import { MessageCircle, X, Send, Bot } from "lucide-react"

// Minimal product shape to pass to the LLM context
type LiteProduct = { id: string; name: string; price: number; category?: string }

// Local chat message type
type ChatMsg = { role: "user" | "assistant"; content: string }

// Helper: persistent customer id
function getOrCreateCustomerId(): string {
  if (typeof window === "undefined") return "anon"
  const key = "ishi_customer_id"
  const existing = localStorage.getItem(key)
  if (existing) return existing
  // Prefer crypto UUID if available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyWin: any = window as any
  const id = anyWin?.crypto?.randomUUID ? anyWin.crypto.randomUUID() : `cust_${Date.now()}`
  localStorage.setItem(key, id)
  return id
}

async function fetchProducts(): Promise<LiteProduct[]> {
  try {
    const snap = await get(ref(database, "products"))
    const val = snap.val() || {}
    const items: LiteProduct[] = Object.entries(val).map(([id, p]: [string, any]) => ({
      id,
      name: (p?.name || "").toString(),
      price: Number(p?.price || 0),
      category: (p?.category || "").toString(),
    }))
    // Limit to top 50 by createdAt desc if present
    const sorted = items
      .sort((a: any, b: any) => (b?.createdAt || 0) - (a?.createdAt || 0))
      .slice(0, 50)
    return sorted
  } catch (e) {
    console.error("Ishi: failed to fetch products", e)
    return []
  }
}

async function fetchTickets(): Promise<any[]> {
  try {
    const snap = await get(ref(database, "tickets"))
    const val = snap.val() || {}
    // Pre-flatten; filter by customer on client later
    return Object.entries(val).map(([id, t]: [string, any]) => ({ id, ...(t || {}) }))
  } catch (e) {
    console.error("Ishi: failed to fetch tickets", e)
    return []
  }
}

export default function IshiChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Namaste! Main Ishi hoon – Shri Karni Home Solutions ki sales & support assistant. Aap products, prices, availability, shipping aur support ke baare mein poochh sakte hain." },
  ])
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<LiteProduct[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [customer, setCustomer] = useState<{ name?: string; email?: string; phone?: string }>({})
  const custIdRef = useRef<string>("")
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    custIdRef.current = getOrCreateCustomerId()
    ;(async () => {
      const [p, t] = await Promise.all([fetchProducts(), fetchTickets()])
      setProducts(p)
      // Only keep tickets for this customer if customerId field present
      const myTickets = t.filter((tk) => !tk.customerId || tk.customerId === custIdRef.current)
      setTickets(myTickets)
    })()
  }, [])

  useEffect(() => {
    // Auto-scroll to bottom on new message
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, open])

  const visibleTickets = useMemo(() => tickets.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5), [tickets])

  async function handleLLM(message: string) {
    setLoading(true)
    try {
      const res = await fetch("/api/ishi-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: messages,
          context: {
            products,
            customer: { id: custIdRef.current, ...customer },
            tickets: visibleTickets.map((t) => ({ id: t.id, status: t.status, subject: t.subject })),
          },
        }),
      })
      const data = await res.json()

      // Append assistant reply
      if (data?.reply) {
        setMessages((m) => [...m, { role: "assistant", content: String(data.reply) }])
      }

      // Persist any customer updates
      if (data?.customerUpdate && (data.customerUpdate.name || data.customerUpdate.email || data.customerUpdate.phone)) {
        const upd: any = {}
        if (data.customerUpdate.name) upd.name = data.customerUpdate.name
        if (data.customerUpdate.email) upd.email = data.customerUpdate.email
        if (data.customerUpdate.phone) upd.phone = data.customerUpdate.phone
        if (Object.keys(upd).length) {
          await update(ref(database, `customers/${custIdRef.current}`), upd)
          setCustomer((c) => ({ ...c, ...upd }))
        }
      }

      // Handle ticket actions
      if (data?.action === "create_ticket") {
        const subject: string = data.ticketSubject || message.slice(0, 80)
        const newRef = await push(ref(database, "tickets"), {
          subject,
          status: "open",
          customerId: custIdRef.current,
          createdAt: Date.now(),
        })
        setTickets((t) => [{ id: newRef.key!, subject, status: "open", customerId: custIdRef.current, createdAt: Date.now() }, ...t])
        setMessages((m) => [
          ...m,
          { role: "assistant", content: `Ticket ban gaya hai. Ticket ID: ${newRef.key}. Hum jald hi aapko update denge.` },
        ])
      } else if (data?.action === "close_ticket") {
        let toCloseId: string | undefined = data.ticketId
        if (!toCloseId) {
          // default: the latest open ticket for this customer
          const openTk = tickets.find((t) => t.status !== "closed" && (!t.customerId || t.customerId === custIdRef.current))
          toCloseId = openTk?.id
        }
        if (toCloseId) {
          await update(ref(database, `tickets/${toCloseId}`), { status: "closed", closedAt: Date.now() })
          setTickets((t) => t.map((x) => (x.id === toCloseId ? { ...x, status: "closed", closedAt: Date.now() } : x)))
          setMessages((m) => [
            ...m,
            { role: "assistant", content: `Ticket ${toCloseId} close kar diya gaya hai. Dhanyavaad!` },
          ])
        } else {
          setMessages((m) => [
            ...m,
            { role: "assistant", content: `Koi open ticket nahi mila close karne ke liye. Aap ticket ID batayenge?` },
          ])
        }
      }
    } catch (e) {
      console.error("Ishi chat error", e)
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Maaf kijiye, abhi kuch samaasya aa gayi. Kripya dobara prayas karein." },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function onSend() {
    const text = input.trim()
    if (!text) return
    setMessages((m) => [...m, { role: "user", content: text }])
    setInput("")
    await handleLLM(text)
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          aria-label="Open Ishi chat"
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg flex items-center justify-center"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-80 max-h-[70vh] bg-white border shadow-xl rounded-lg flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-orange-600 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <div className="text-sm font-semibold">Ishi</div>
                <div className="text-[11px] opacity-90">Sales & Support Assistant</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="p-1 hover:bg-white/10 rounded">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tickets summary (top 1-2) */}
          {visibleTickets.length > 0 && (
            <div className="px-3 py-2 border-b bg-orange-50/60">
              <div className="text-[12px] text-orange-800">Recent tickets:</div>
              <ul className="space-y-1 mt-1">
                {visibleTickets.map((t) => (
                  <li key={t.id} className="text-[12px] text-gray-700">
                    #{t.id.slice(-6)} • {t.subject || "(no subject)"} • {t.status}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2 bg-gray-50">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm shadow ${
                    m.role === "assistant" ? "bg-white text-gray-900" : "bg-orange-600 text-white"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-xs text-gray-500">Ishi is typing…</div>
            )}
          </div>

          {/* Input */}
          <div className="p-2 border-t bg-white">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    onSend()
                  }
                }}
                placeholder="Ask about products, prices, support…"
                className="flex-1 text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={onSend}
                disabled={loading}
                className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-1 text-[10px] text-gray-500">
              Ishi only discusses this website. Don’t share sensitive info.
            </div>
          </div>
        </div>
      )}
    </>
  )
}
