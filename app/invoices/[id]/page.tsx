"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { database } from "@/lib/firebase"
import { ref, get } from "firebase/database"
import type { Order } from "@/types/order"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer } from "lucide-react"

export default function InvoicePage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = params?.id as string | undefined
    if (!id) return
    const fetchOrder = async () => {
      try {
        const snap = await get(ref(database, `orders/${id}`))
        const data = snap.val()
        if (data) {
          setOrder({ id, ...data })
        }
      } catch (e) {
        console.error("Failed to load order", e)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [params?.id])

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print()
  }

  const dateString = useMemo(() => {
    if (!order) return ""
    try {
      return new Date(order.createdAt).toLocaleDateString()
    } catch {
      return ""
    }
  }, [order])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">Order not found.</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    )
  }

  const subtotal = (order.products || []).reduce((sum, p) => sum + (p.price || 0) * (p.quantity || 1), 0)
  const grandTotal = order.totalAmount ?? subtotal

  return (
    <div className="min-h-screen bg-gray-50 py-8 print:bg-white">
      <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg border p-6 sm:p-8">
        {/* Actions */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Button onClick={handlePrint} className="bg-orange-500 hover:bg-orange-600">
            <Printer className="h-4 w-4 mr-2" /> Print Invoice
          </Button>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between border-b pb-6 mb-6">
          <div>
            <h1 className="text-xl font-semibold">Shri Karni E-Store</h1>
            <p className="text-sm text-gray-600">Reliable products at best prices</p>
            <p className="text-sm text-gray-600">support@shrikarni.store</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-semibold">Invoice</h2>
            <p className="text-sm text-gray-600">Order ID: {order.id}</p>
            <p className="text-sm text-gray-600">Date: {dateString}</p>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="space-y-1">
            <h3 className="font-medium">Billed To</h3>
            <p className="text-sm text-gray-700 whitespace-pre-line">{order.customerName}</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{order.address}</p>
            <p className="text-sm text-gray-700">{order.phone}</p>
          </div>
          <div className="space-y-1 sm:text-right">
            <h3 className="font-medium">Payment</h3>
            <p className="text-sm text-gray-700">Method: {order.paymentMethod || "Cash on Delivery"}</p>
          </div>
        </div>

        {/* Items */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-gray-50">
                <th className="p-3 font-medium text-gray-600">Item</th>
                <th className="p-3 font-medium text-gray-600 text-right">Qty</th>
                <th className="p-3 font-medium text-gray-600 text-right">Price</th>
                <th className="p-3 font-medium text-gray-600 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.products || []).map((p, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-3 text-gray-800">{p.name}</td>
                  <td className="p-3 text-right">{p.quantity}</td>
                  <td className="p-3 text-right">₹{(p.price || 0).toLocaleString()}</td>
                  <td className="p-3 text-right">₹{(((p.price || 0) * (p.quantity || 1)) || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="flex flex-col items-end mt-6">
          <div className="w-full sm:w-80 bg-gray-50 rounded border">
            <div className="flex justify-between p-3 border-b">
              <span className="text-gray-600">Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-3 border-b">
              <span className="text-gray-600">Shipping</span>
              <span>₹0</span>
            </div>
            <div className="flex justify-between p-3 font-semibold">
              <span>Total</span>
              <span>₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-gray-500 mt-8">
          <p>Thank you for shopping with Shri Karni E-Store.</p>
          <p>For returns/replacements, please contact support within 7 days of delivery.</p>
        </div>
      </div>
    </div>
  )
}
