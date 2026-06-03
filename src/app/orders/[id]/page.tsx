'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLang } from '@/contexts/language-context'
import { api } from '@/lib/api'
import { formatUsd } from '@/lib/shared'
import { OrderStatus, PaymentMethod, PaymentStatus } from '@/lib/shared'

interface OrderItem {
  id: string
  productId: string
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
}

interface Shipment {
  trackingNumber: string
  carrier: string
}

interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  totalUsd: number
  notes: string | null
  createdAt: string
  items: OrderItem[]
  payments: Payment[]
  shipment: Shipment | null
}

const STATUS_STEPS: OrderStatus[] = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAID,
  OrderStatus.PREPARING,
  OrderStatus.SHIPPED,
  OrderStatus.CUSTOMS,
  OrderStatus.DELIVERED,
]

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, token, loading: authLoading } = useAuth()
  const { t, formatDate } = useLang()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function loadOrder() {
    if (!token) return
    try {
      const res = await api.get<{ data: Order }>(`/api/orders/${id}`, token)
      setOrder(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    loadOrder()
  }, [user, token, id, authLoading])

  async function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !token) return
    setUploading(true)
    setUploadMsg('')
    try {
      const form = new FormData()
      form.append('receipt', file)
      const res = await fetch(`/api/orders/${id}/payment/tt`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? 'Upload failed')
      setUploadMsg(t.orderDetail.receiptPending)
      loadOrder()
    } catch (err: unknown) {
      setUploadMsg(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>
  }

  if (!order) {
    return <div className="text-center py-16 text-gray-500">{t.orderDetail.orderNotFound}</div>
  }

  const currentStepIdx = STATUS_STEPS.indexOf(order.status)
  const isCancelled = order.status === OrderStatus.CANCELLED
  const canUploadReceipt =
    order.paymentMethod === PaymentMethod.TT_WIRE &&
    order.paymentStatus === PaymentStatus.UNPAID &&
    !isCancelled

  const paymentStatusLabel =
    order.paymentStatus === PaymentStatus.PAID ? t.orderDetail.verified :
    order.paymentStatus === PaymentStatus.PENDING_VERIFICATION ? t.orderDetail.pendingVerification :
    t.orderDetail.unpaid

  const paymentStatusColor =
    order.paymentStatus === PaymentStatus.PAID ? 'text-green-600' :
    order.paymentStatus === PaymentStatus.PENDING_VERIFICATION ? 'text-amber-600' :
    'text-red-500'

  const statusLabel = isCancelled
    ? t.orderDetail.cancelled
    : (t.orderDetail.steps[currentStepIdx] ?? order.status)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-1">
        ← {t.orderDetail.backToOrders}
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {t.orderDetail.placed} {formatDate(order.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/orders/${order.id}/invoice`}
            className="text-xs font-medium text-gray-500 border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
          >
            Proforma Invoice
          </Link>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${isCancelled ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-700'}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Order progress */}
      {!isCancelled && (
        <div className="mb-8">
          <div className="flex items-center">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i <= currentStepIdx ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {i < currentStepIdx ? '✓' : i + 1}
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${i < currentStepIdx ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex mt-1">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className={`flex-1 text-center text-xs last:flex-none ${i <= currentStepIdx ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                {t.orderDetail.steps[i]}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">{t.orderDetail.items} ({order.items.length})</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {order.items.map(item => {
            const img = item.product.images[0] ?? 'https://placehold.co/64x64?text=?'
            return (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  <Image src={img} alt={item.product.nameEn} fill className="object-cover" unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.product.nameEn}</p>
                  <p className="text-xs text-gray-400">
                    SKU: {item.product.sku} · {formatUsd(item.unitPriceUsd)}{t.orderDetail.perPc} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900 shrink-0">{formatUsd(item.subtotalUsd)}</p>
              </div>
            )
          })}
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-between">
          <span className="text-sm font-semibold text-gray-700">{t.orderDetail.total}</span>
          <span className="text-sm font-bold text-gray-900">{formatUsd(order.totalUsd)}</span>
        </div>
      </div>

      {/* Payment */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">{t.orderDetail.payment}</h2>
        </div>
        <div className="px-5 py-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">{t.orderDetail.method}</span>
            <span className="font-medium">{t.orderDetail.ttWire}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t.orderDetail.status}</span>
            <span className={`font-semibold ${paymentStatusColor}`}>
              {paymentStatusLabel}
            </span>
          </div>

          {canUploadReceipt && (
            <div className="mt-5 bg-blue-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-blue-900 mb-1">{t.orderDetail.bankDetails}</p>
              <div className="text-xs text-blue-800 space-y-1 mb-4">
                <p>Bank: <span className="font-medium">{t.orderDetail.bankName} (Yiwu Branch)</span></p>
                <p>Account: <span className="font-medium">{t.orderDetail.accountNumber}</span></p>
                <p>SWIFT: <span className="font-medium">{t.orderDetail.swift}</span></p>
                <p>{t.orderDetail.beneficiary}: <span className="font-medium">{t.orderDetail.accountName}</span></p>
                <p>{t.orderDetail.reference}: <span className="font-medium">{order.orderNumber}</span></p>
              </div>
              <p className="text-xs font-medium text-blue-700 mb-2">{t.orderDetail.uploadReceipt}:</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleReceiptUpload}
                disabled={uploading}
                className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer disabled:opacity-50"
              />
              {uploading && <p className="text-xs text-blue-600 mt-2">{t.orderDetail.uploading}</p>}
            </div>
          )}

          {uploadMsg && (
            <p className={`text-xs mt-3 ${uploadMsg === t.orderDetail.receiptPending ? 'text-green-600' : 'text-red-500'}`}>
              {uploadMsg}
            </p>
          )}

          {order.payments.length > 0 && (
            <div className="mt-4 space-y-2">
              {order.payments.map(p => (
                <div key={p.id} className="text-xs text-gray-500 flex justify-between">
                  <span>{t.orderDetail.submitted} {formatDate(p.createdAt)}</span>
                  {p.receiptUrl && (
                    <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {t.orderDetail.viewReceipt}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Shipment tracking */}
      {order.shipment && (
        <div className="bg-white rounded-xl border border-gray-200 mb-4">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">{t.orderDetail.shipment}</h2>
          </div>
          <div className="px-5 py-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t.orderDetail.carrier}</span>
              <span className="font-medium text-gray-900">{order.shipment.carrier}</span>
            </div>
            {order.shipment.trackingNumber && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t.orderDetail.trackingNumber}</span>
                <span className="font-mono font-medium text-gray-900">{order.shipment.trackingNumber}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {order.notes && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">{t.orderDetail.notes}</h2>
          </div>
          <p className="px-5 py-4 text-sm text-gray-600">{order.notes}</p>
        </div>
      )}
    </div>
  )
}
