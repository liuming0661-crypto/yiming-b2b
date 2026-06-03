'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/lib/api'
import { formatUsd } from '@/lib/shared'
import { OrderStatus, PaymentStatus } from '@/lib/shared'

interface BuyerDetail {
  id: string
  email: string
  companyName: string
  contactName: string
  country: string
  phone: string | null
  status: string
  createdAt: string
  orders: {
    id: string
    orderNumber: string
    status: OrderStatus
    paymentStatus: PaymentStatus
    totalUsd: number
    createdAt: string
    _count: { items: number }
  }[]
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  [OrderStatus.PENDING_PAYMENT]: 'bg-amber-100 text-amber-700',
  [OrderStatus.PAID]: 'bg-blue-100 text-blue-700',
  [OrderStatus.PREPARING]: 'bg-blue-100 text-blue-700',
  [OrderStatus.SHIPPED]: 'bg-purple-100 text-purple-700',
  [OrderStatus.CUSTOMS]: 'bg-purple-100 text-purple-700',
  [OrderStatus.DELIVERED]: 'bg-green-100 text-green-700',
  [OrderStatus.CANCELLED]: 'bg-gray-100 text-gray-500',
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  [OrderStatus.PENDING_PAYMENT]: 'Pending Payment',
  [OrderStatus.PAID]: 'Paid',
  [OrderStatus.PREPARING]: 'Preparing',
  [OrderStatus.SHIPPED]: 'Shipped',
  [OrderStatus.CUSTOMS]: 'In Customs',
  [OrderStatus.DELIVERED]: 'Delivered',
  [OrderStatus.CANCELLED]: 'Cancelled',
}

export default function AdminBuyerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuth()
  const [buyer, setBuyer] = useState<BuyerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  useEffect(() => {
    if (!token) return
    api.get<{ data: BuyerDetail }>(`/api/admin/buyers/${id}`, token)
      .then(res => setBuyer(res.data))
      .finally(() => setLoading(false))
  }, [token, id])

  async function setStatus(status: string) {
    if (!token || !buyer) return
    setUpdatingStatus(true)
    setStatusMsg('')
    try {
      const res = await api.patch<{ data: BuyerDetail }>(`/api/admin/buyers/${id}`, token, { status })
      setBuyer(res.data)
      setStatusMsg(`Status updated to ${status}`)
      setTimeout(() => setStatusMsg(''), 2000)
    } catch (err: unknown) {
      setStatusMsg(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) return <div className="p-6 text-gray-400">Loading…</div>
  if (!buyer) return <div className="p-6 text-red-500">Buyer not found</div>

  const totalSpend = buyer.orders.reduce((sum, o) => sum + o.totalUsd, 0)
  const initials = buyer.companyName.slice(0, 2).toUpperCase()

  return (
    <div className="p-6 max-w-4xl">
      <Link href="/admin/buyers" className="text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6 block">
        ← All Buyers
      </Link>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Profile card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center shrink-0">
              <span className="text-white font-black text-lg">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 truncate">{buyer.companyName}</h1>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  buyer.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>{buyer.status}</span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{buyer.contactName}</p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-gray-400 font-medium uppercase tracking-wide">Email</dt>
              <dd className="text-gray-800 mt-0.5 truncate">{buyer.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400 font-medium uppercase tracking-wide">Country</dt>
              <dd className="text-gray-800 mt-0.5">{buyer.country}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400 font-medium uppercase tracking-wide">Phone</dt>
              <dd className="text-gray-800 mt-0.5">{buyer.phone ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400 font-medium uppercase tracking-wide">Member Since</dt>
              <dd className="text-gray-800 mt-0.5">{new Date(buyer.createdAt).toLocaleDateString()}</dd>
            </div>
          </dl>
          <div className="mt-5 flex gap-2 flex-wrap items-center">
            {buyer.status !== 'ACTIVE' && (
              <button
                onClick={() => setStatus('ACTIVE')}
                disabled={updatingStatus}
                className="px-4 py-1.5 rounded-full bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                Activate
              </button>
            )}
            {buyer.status !== 'SUSPENDED' && (
              <button
                onClick={() => setStatus('SUSPENDED')}
                disabled={updatingStatus}
                className="px-4 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                Suspend
              </button>
            )}
            {buyer.status !== 'PENDING' && (
              <button
                onClick={() => setStatus('PENDING')}
                disabled={updatingStatus}
                className="px-4 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold hover:bg-amber-100 disabled:opacity-50 transition-colors"
              >
                Set Pending
              </button>
            )}
            {statusMsg && (
              <span className={`text-xs font-medium ${statusMsg.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>
                {statusMsg}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Total Orders</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{buyer.orders.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Total Spend</p>
            <p className="text-2xl font-black text-green-600 mt-1">{formatUsd(totalSpend)}</p>
          </div>
        </div>
      </div>

      {/* Orders */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Order History</h2>
        </div>
        {buyer.orders.length === 0 ? (
          <p className="text-center py-12 text-sm text-gray-400">No orders yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {buyer.orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-medium text-blue-600 hover:underline">
                      {o.orderNumber}
                    </Link>
                    <p className="text-xs text-gray-400">{o._count.items} item{o._count.items !== 1 ? 's' : ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[o.status]}`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {o.paymentStatus === PaymentStatus.PENDING_VERIFICATION ? (
                      <span className="text-xs text-amber-600 font-medium">Pending verify</span>
                    ) : o.paymentStatus === PaymentStatus.PAID ? (
                      <span className="text-xs text-green-600 font-medium">Verified</span>
                    ) : (
                      <span className="text-xs text-gray-400">Unpaid</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatUsd(o.totalUsd)}</td>
                  <td className="px-4 py-3 text-right text-xs text-gray-400">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
