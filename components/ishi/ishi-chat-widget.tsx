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
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<LiteProduct[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [customer, setCustomer] = useState<{ name?: string; email?: string; phone?: string }>({})
  const custIdRef = useRef<string>("")
  const listRef = useRef<HTMLDivElement>(null)
  const [awaitingContact, setAwaitingContact] = useState(false)
  const [pendingTicketSubject, setPendingTicketSubject] = useState<string | null>(null)
  const [contactDraft, setContactDraft] = useState<{ name: string; phone: string; email: string }>({ name: "", phone: "", email: "" })

  useEffect(() => {
    custIdRef.current = getOrCreateCustomerId()
    ;(async () => {
      const [p, t, custSnap, chatSnap] = await Promise.all([
        fetchProducts(),
        fetchTickets(),
        get(ref(database, `customers/${custIdRef.current}`)).catch(() => null as any),
        get(ref(database, `chats/${custIdRef.current}/messages`)).catch(() => null as any),
      ])
      setProducts(p)
      // Only keep tickets for this customer if customerId field present
      const myTickets = t.filter((tk) => !tk.customerId || tk.customerId === custIdRef.current)
      setTickets(myTickets)

      // Load existing customer profile if present
      const custVal = custSnap ? (custSnap as any).val() : null
      if (custVal && typeof custVal === "object") {
        setCustomer({
          name: (custVal.name || "").toString() || undefined,
          email: (custVal.email || "").toString() || undefined,
          phone: (custVal.phone || "").toString() || undefined,
        })
      }

      // Load chat history for continuity
      const chatVal = chatSnap ? (chatSnap as any).val() : null
      if (chatVal && typeof chatVal === "object") {
        const arr = Object.values(chatVal as Record<string, any>)
          .map((m: any) => ({
            role: m?.role === "assistant" ? "assistant" : "user",
            content: (m?.content || "").toString(),
            createdAt: Number(m?.createdAt || 0),
          }))
          .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
        if (arr.length > 0) {
          setMessages(arr.map(({ role, content }) => ({ role: role as "user" | "assistant", content })))
        } else {
          setMessages([
            { role: "assistant", content: "Namaste! Main Ishi hoon – Shri Karni Home Solutions ki sales & support assistant. Aap products, prices, availability, shipping aur support ke baare mein poochh sakte hain." },
          ])
        }
      } else {
        setMessages([
          { role: "assistant", content: "Namaste! Main Ishi hoon – Shri Karni Home Solutions ki sales & support assistant. Aap products, prices, availability, shipping aur support ke baare mein poochh sakte hain." },
        ])
      }
    })()
  }, [])

  useEffect(() => {
    // Auto-scroll to bottom on new message
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, open])

  const visibleTickets = useMemo(() => tickets.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5), [tickets])

  async function handleLLM(message: string, historyOverride?: ChatMsg[]) {
    setLoading(true)
    try {
      const res = await fetch("/api/ishi-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: historyOverride ?? messages,
          context: {
            products,
            customer: { id: custIdRef.current, ...customer },
            tickets: visibleTickets.map((t) => ({ id: t.id, status: t.status, subject: t.subject })),
          },
        }),
      })
      if (!res.ok) {
        throw new Error(`Ishi API error: ${res.status}`)
      }
      const data = await res.json()

      // Append assistant reply
      if (data?.reply) {
        let replyText = String(data.reply).trim()
        // Soft-guard to avoid repeated greeting when conversation already ongoing
        const recentAssistantExists = messages.slice(-4).some((m) => m.role === "assistant")
        if (recentAssistantExists) {
          replyText = replyText.replace(/^namaste!?[,\.\s-]*/i, "").trim()
        }
        setMessages((m) => [...m, { role: "assistant" as const, content: replyText }])

        // Persist assistant message and update chat meta
        try {
          const now = Date.now()
          await push(ref(database, `chats/${custIdRef.current}/messages`), {
            role: "assistant",
            content: replyText,
            createdAt: now,
          })
          await update(ref(database, `chats/${custIdRef.current}/meta`), {
            customerId: custIdRef.current,
            name: customer?.name || null,
            email: customer?.email || null,
            phone: customer?.phone || null,
            lastMessageAt: now,
            lastMessageRole: "assistant",
            lastMessageText: replyText.slice(0, 1000),
          })
        } catch (e) {
          console.error("Ishi: failed to persist assistant message", e)
        }
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
          // Mirror updates to chat meta
          await update(ref(database, `chats/${custIdRef.current}/meta`), {
            ...(upd.name ? { name: upd.name } : {}),
            ...(upd.email ? { email: upd.email } : {}),
            ...(upd.phone ? { phone: upd.phone } : {}),
          })
        }
      }

      // Handle ticket actions
      if (data?.action === "create_ticket") {
        const subject: string = data.ticketSubject || message.slice(0, 80)
        // Enforce contact details before creating a complaint ticket
        const needName = !customer?.name || !String(customer.name).trim()
        const needPhone = !customer?.phone || !String(customer.phone).trim()
        if (needName || needPhone) {
          setAwaitingContact(true)
          setPendingTicketSubject(subject)
          setMessages((m) => [
            ...m,
            { role: "assistant" as const, content: "Complaint register karne ke liye kripya apna naam aur phone number dein (email optional)." },
          ])
          return
        }
        const newRef = await push(ref(database, "tickets"), {
          subject,
          status: "open",
          customerId: custIdRef.current,
          createdAt: Date.now(),
          customerName: customer?.name || null,
          customerPhone: customer?.phone || null,
          customerEmail: customer?.email || null,
        })
        setTickets((t) => [
          {
            id: newRef.key!,
            subject,
            status: "open",
            customerId: custIdRef.current,
            createdAt: Date.now(),
            customerName: customer?.name || null,
            customerPhone: customer?.phone || null,
            customerEmail: customer?.email || null,
          },
          ...t,
        ])
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
    const nextMsgs: ChatMsg[] = [...messages, { role: "user" as const, content: text }]
    setMessages(nextMsgs)
    setInput("")
    // Persist user message immediately for history continuity
    try {
      const now = Date.now()
      await push(ref(database, `chats/${custIdRef.current}/messages`), {
        role: "user",
        content: text,
        createdAt: now,
      })
      await update(ref(database, `chats/${custIdRef.current}/meta`), {
        customerId: custIdRef.current,
        name: customer?.name || null,
        email: customer?.email || null,
        phone: customer?.phone || null,
        lastMessageAt: now,
        lastMessageRole: "user",
        lastMessageText: text.slice(0, 1000),
      })
    } catch (e) {
      console.error("Ishi: failed to persist user message", e)
    }
    await handleLLM(text, nextMsgs)
  }

  async function submitContactAndCreateTicket() {
    try {
      const name = contactDraft.name.trim()
      const phone = contactDraft.phone.trim()
      const email = contactDraft.email.trim()
      if (!name || !phone) {
        setMessages((m) => [
          ...m,
          { role: "assistant" as const, content: "Naam aur phone jaroori hain. Kripya dono provide karein." },
        ])
        return
      }
      setLoading(true)
      // Persist customer details
      await update(ref(database, `customers/${custIdRef.current}`), { name, phone, email: email || null })
      setCustomer((c) => ({ ...c, name, phone, ...(email ? { email } : {}) }))
      await update(ref(database, `chats/${custIdRef.current}/meta`), {
        customerId: custIdRef.current,
        name,
        phone,
        email: email || null,
      })

      // Create the pending ticket if any
      const subject = pendingTicketSubject || "Customer Complaint"
      const newRef = await push(ref(database, "tickets"), {
        subject,
        status: "open",
        customerId: custIdRef.current,
        createdAt: Date.now(),
        customerName: name,
        customerPhone: phone,
        customerEmail: email || null,
      })
      setTickets((t) => [
        { id: newRef.key!, subject, status: "open", customerId: custIdRef.current, createdAt: Date.now(), customerName: name, customerPhone: phone, customerEmail: email || null },
        ...t,
      ])
      setMessages((m) => [
        ...m,
        { role: "assistant" as const, content: `Dhanyavaad! Aapka complaint register ho gaya. Ticket ID: ${newRef.key}. Hum jald hi aapko update denge.` },
      ])
    } catch (e) {
      console.error("Ishi: contact submit failed", e)
      setMessages((m) => [
        ...m,
        { role: "assistant" as const, content: "Maaf kijiye, contact details save karte samay samasya hui. Kripya dobara koshish karein." },
      ])
    } finally {
      setAwaitingContact(false)
      setPendingTicketSubject(null)
      setContactDraft({ name: "", phone: "", email: "" })
      setLoading(false)
    }
  }

  function cancelAwaitingContact() {
    setAwaitingContact(false)
    setPendingTicketSubject(null)
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
            {awaitingContact && (
              <div className="mb-2 p-2 border rounded-md bg-orange-50">
                <div className="text-xs font-medium text-orange-800 mb-2">Complaint ke liye contact details zaroori hain</div>
                <div className="flex flex-col gap-2">
                  <input
                    value={contactDraft.name}
                    onChange={(e) => setContactDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="Name (required)"
                    className="text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    value={contactDraft.phone}
                    onChange={(e) => setContactDraft((d) => ({ ...d, phone: e.target.value }))}
                    placeholder="Phone (required)"
                    className="text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    value={contactDraft.email}
                    onChange={(e) => setContactDraft((d) => ({ ...d, email: e.target.value }))}
                    placeholder="Email (optional)"
                    className="text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={submitContactAndCreateTicket}
                      disabled={loading}
                      className="h-9 px-3 inline-flex items-center justify-center rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60"
                    >
                      Save & Create Ticket
                    </button>
                    <button
                      onClick={cancelAwaitingContact}
                      className="h-9 px-3 inline-flex items-center justify-center rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (awaitingContact) return
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    onSend()
                  }
                }}
                disabled={loading || awaitingContact}
                placeholder="Ask about products, prices, support…"
                className="flex-1 text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:text-gray-400"
              />
              <button
                onClick={onSend}
                disabled={loading || awaitingContact}
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
