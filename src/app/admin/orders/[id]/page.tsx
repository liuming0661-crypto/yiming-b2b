'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/lib/api'
import { formatUsd } from '@/lib/shared'
import { OrderStatus, PaymentStatus } from '@/lib/shared'

interface OrderItem {
  id: string
  quantity: number
  unitPriceUsd: number
  subtotalUsd: number
  product: { nameEn: string; sku: string; images: string[] }
}

interface Payment {
  id: string
  method: string
  amountUsd: number
  status: PaymentStatus
  receiptUrl: string | null
  createdAt: string
  verifiedAt: string | null
}

interface Shipment {
  trackingNumber: string
  carrier: string
}

interface AdminOrderDetail {
  id: string
  orderNumber: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: string
  totalUsd: number
  notes: string | null
  createdAt: string
  buyer: { companyName: string; country: string; email: string; contactName: string; phone: string | null }
  items: OrderItem[]
  payments: Payment[]
  shipment: Shipment | null
}

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Pending Payment', PAID: 'Paid', PREPARING: 'Preparing',
  SHIPPED: 'Shipped', CUSTOMS: 'In Customs', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuth()
  const router = useRouter()
  const [order, setOrder] = useState<AdminOrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [carrier, setCarrier] = useState('')
  const [msg, setMsg] = useState('')

  async function load() {
    if (!token) return
    try {
      const res = await api.get<{ data: AdminOrderDetail }>(`/api/admin/orders/${id}`, token)
      setOrder(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token, id])

  async function verify(approved: boolean) {
    if (!token) return
    setVerifying(true)
    setMsg('')
    try {
      await api.post(`/api/admin/orders/${id}/verify-payment`, token, { approved })
      setMsg(approved ? 'Payment approved!' : 'Payment rejected.')
      load()
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Failed')
    } finally {
      setVerifying(false)
    }
  }

  async function updateStatus(status: OrderStatus) {
    if (!token) return
    setUpdatingStatus(true)
    setMsg('')
    try {
      await api.put(`/api/admin/orders/${id}/status`, token, {
        status,
        ...(status === OrderStatus.SHIPPED ? { trackingNumber, carrier } : {}),
      })
      setMsg(`Status updated to ${STATUS_LABEL[status]}.`)
      load()
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Failed')
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>
  if (!order) return <div className="text-center py-16 text-gray-500">Order not found</div>

  const pendingPayment = order.paymentStatus === PaymentStatus.PENDING_VERIFICATION
  const latestReceipt = order.payments?.find(p => p.status === PaymentStatus.PENDING_VERIFICATION)
    ?? order.payments?.[0]

  return (
    <div className="p-6 max-w-4xl">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-1">
        ← Back to orders
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <span className="text-sm font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700">
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Buyer */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Buyer</p>
          <p className="font-semibold text-gray-900">{order.buyer?.companyName}</p>
          <p className="text-sm text-gray-500">{order.buyer?.contactName}</p>
          <p className="text-sm text-gray-500">{order.buyer?.email}</p>
          {order.buyer?.phone && <p className="text-sm text-gray-500">{order.buyer.phone}</p>}
          <p className="text-sm text-gray-400 mt-1">{order.buyer?.country}</p>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Payment</p>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Method</span>
            <span className="font-medium">T/T Wire Transfer</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Amount</span>
            <span className="font-bold text-gray-900">{formatUsd(order.totalUsd)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className={`font-semibold ${
              order.paymentStatus === PaymentStatus.PAID ? 'text-green-600' :
              pendingPayment ? 'text-amber-600' : 'text-gray-400'
            }`}>
              {order.paymentStatus === PaymentStatus.PAID ? 'Verified' :
               pendingPayment ? 'Pending Verification' : 'Unpaid'}
            </span>
          </div>

          {/* Receipt */}
          {latestReceipt?.receiptUrl && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <a
                href={latestReceipt.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                View receipt →
              </a>
              <p className="text-xs text-gray-400 mt-0.5">
                Submitted {new Date(latestReceipt.createdAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Verify Payment Actions */}
      {pendingPayment && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-4">
          <p className="text-sm font-semibold text-amber-900 mb-3">Receipt submitted — verify this payment</p>
          {msg && (
            <p className={`text-sm mb-3 ${msg.includes('approved') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => verify(true)}
              disabled={verifying}
              className="px-5 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {verifying ? 'Processing…' : 'Approve Payment'}
            </button>
            <button
              onClick={() => verify(false)}
              disabled={verifying}
              className="px-5 py-2.5 rounded-lg border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {msg && !pendingPayment && (
        <div className={`rounded-xl p-4 mb-4 text-sm font-medium ${msg.includes('approved') || msg.includes('updated') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {msg}
        </div>
      )}

      {/* Status Progression */}
      {order.paymentStatus === PaymentStatus.PAID && order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Update Order Status</p>

          {/* Progress bar */}
          {(() => {
            const steps = [
              { key: OrderStatus.PAID, label: 'Paid' },
              { key: OrderStatus.PREPARING, label: 'Preparing' },
              { key: OrderStatus.SHIPPED, label: 'Shipped' },
              { key: OrderStatus.CUSTOMS, label: 'Customs' },
              { key: OrderStatus.DELIVERED, label: 'Delivered' },
            ]
            const currentIdx = steps.findIndex(s => s.key === order.status)
            return (
              <div className="flex items-center mb-5">
                {steps.map((step, i) => (
                  <div key={step.key} className="flex items-center flex-1 last:flex-none">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i <= currentIdx ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>{i + 1}</div>
                    <span className={`text-xs ml-1.5 mr-1.5 ${i <= currentIdx ? 'text-blue-700 font-medium' : 'text-gray-400'}`}>{step.label}</span>
                    {i < steps.length - 1 && <div className={`flex-1 h-px ${i < currentIdx ? 'bg-blue-300' : 'bg-gray-200'}`} />}
                  </div>
                ))}
              </div>
            )
          })()}

          {order.status === OrderStatus.PAID && (
            <button
              onClick={() => updateStatus(OrderStatus.PREPARING)}
              disabled={updatingStatus}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {updatingStatus ? 'Updating…' : 'Mark as Preparing'}
            </button>
          )}

          {order.status === OrderStatus.PREPARING && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tracking Number</label>
                  <input
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    placeholder="e.g. SF1234567890"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Carrier</label>
                  <input
                    value={carrier}
                    onChange={e => setCarrier(e.target.value)}
                    placeholder="e.g. SF Express, DHL"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={() => updateStatus(OrderStatus.SHIPPED)}
                disabled={updatingStatus}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {updatingStatus ? 'Updating…' : 'Mark as Shipped'}
              </button>
            </div>
          )}

          {order.status === OrderStatus.SHIPPED && (
            <div className="space-y-3">
              {order.shipment && (
                <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3">
                  <span className="font-medium">{order.shipment.carrier}</span>
                  {order.shipment.trackingNumber && <span className="text-gray-400 ml-2">#{order.shipment.trackingNumber}</span>}
                </div>
              )}
              <button
                onClick={() => updateStatus(OrderStatus.CUSTOMS)}
                disabled={updatingStatus}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {updatingStatus ? 'Updating…' : 'Mark as In Customs'}
              </button>
            </div>
          )}

          {order.status === OrderStatus.CUSTOMS && (
            <button
              onClick={() => updateStatus(OrderStatus.DELIVERED)}
              disabled={updatingStatus}
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {updatingStatus ? 'Updating…' : 'Mark as Delivered'}
            </button>
          )}
        </div>
      )}

      {/* Cancel Order */}
      {order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={async () => {
              if (!confirm('Cancel this order? This cannot be undone.')) return
              await updateStatus(OrderStatus.CANCELLED)
            }}
            disabled={updatingStatus}
            className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            Cancel Order
          </button>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Items ({order.items?.length ?? 0})</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {(order.items ?? []).map(item => {
            const img = item.product?.images?.[0] ?? 'https://placehold.co/64x64?text=?'
            return (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  <Image src={img} alt={item.product?.nameEn ?? ''} fill className="object-cover" unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.product?.nameEn}</p>
                  <p className="text-xs text-gray-400">SKU: {item.product?.sku} · {formatUsd(item.unitPriceUsd)}/pc × {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900 shrink-0">{formatUsd(item.subtotalUsd)}</p>
              </div>
            )
          })}
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-between">
          <span className="text-sm font-semibold text-gray-700">Total</span>
          <span className="text-sm font-bold text-gray-900">{formatUsd(order.totalUsd)}</span>
        </div>
      </div>

      {/* Buyer notes */}
      {order.notes && (
        <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-5">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">Buyer Notes</p>
          <p className="text-sm text-amber-900 leading-relaxed">{order.notes}</p>
        </div>
      )}
    </div>
  )
}
