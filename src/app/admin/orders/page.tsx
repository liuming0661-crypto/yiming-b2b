'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/lib/api'
import { formatUsd } from '@/lib/shared'
import { OrderStatus, PaymentStatus } from '@/lib/shared'
import { useDebounce } from '@/hooks/useDebounce'

interface AdminOrder {
  id: string
  orderNumber: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: string
  totalUsd: number
  createdAt: string
  buyer: { companyName: string; country: string; email: string }
  _count: { items: number }
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

const PAYMENT_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Awaiting Receipt', value: PaymentStatus.UNPAID },
  { label: 'Pending Verify', value: PaymentStatus.PENDING_VERIFICATION },
  { label: 'Verified', value: PaymentStatus.PAID },
]

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending Payment', value: OrderStatus.PENDING_PAYMENT },
  { label: 'Paid', value: OrderStatus.PAID },
  { label: 'Preparing', value: OrderStatus.PREPARING },
  { label: 'Shipped', value: OrderStatus.SHIPPED },
  { label: 'Customs', value: OrderStatus.CUSTOMS },
  { label: 'Delivered', value: OrderStatus.DELIVERED },
  { label: 'Cancelled', value: OrderStatus.CANCELLED },
]

export default function AdminOrdersPage() {
  const { token } = useAuth()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [paymentFilter, setPaymentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20
  const debouncedSearch = useDebounce(search, 400)

  async function load(ps: string, ss: string, q: string, pg: number) {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (ps) params.set('paymentStatus', ps)
      if (ss) params.set('status', ss)
      if (q) params.set('q', q)
      params.set('page', String(pg))
      params.set('pageSize', String(PAGE_SIZE))
      const res = await api.get<{ data: AdminOrder[]; total: number }>(`/api/admin/orders?${params.toString()}`, token)
      setOrders(res.data)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    load(paymentFilter, statusFilter, debouncedSearch, page)
  }, [token, paymentFilter, statusFilter, debouncedSearch, page])

  function handlePaymentFilter(val: string) {
    setPaymentFilter(val); setPage(1)
  }

  function handleStatusFilter(val: string) {
    setStatusFilter(val); setPage(1)
  }

  function goPage(pg: number) {
    setPage(pg)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const pendingCount = orders.filter(o => o.paymentStatus === PaymentStatus.PENDING_VERIFICATION).length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search order # or company…"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
          {pendingCount > 0 && !paymentFilter && (
            <button
              onClick={() => handlePaymentFilter(PaymentStatus.PENDING_VERIFICATION)}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <span className="w-5 h-5 bg-amber-500 text-white rounded-full text-xs flex items-center justify-center font-bold">{pendingCount}</span>
              Receipts to verify
            </button>
          )}
        </div>
      </div>

      {/* Payment filter tabs */}
      <div className="flex gap-1 mb-2 bg-gray-100 rounded-lg p-1 w-fit">
        {PAYMENT_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => handlePaymentFilter(f.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              paymentFilter === f.value ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => handleStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              statusFilter === f.value
                ? 'bg-gray-900 text-white border-gray-900'
                : 'text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No orders found</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Buyer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(order => (
                <tr
                  key={order.id}
                  className={`hover:bg-gray-50 transition-colors ${order.paymentStatus === PaymentStatus.PENDING_VERIFICATION ? 'bg-amber-50/50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium text-blue-600 hover:underline">
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-gray-400">{order._count.items} item{order._count.items !== 1 ? 's' : ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{order.buyer.companyName}</p>
                    <p className="text-xs text-gray-400">{order.buyer.country} · {order.buyer.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[order.status]}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {order.paymentStatus === PaymentStatus.PENDING_VERIFICATION ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Verify now
                      </span>
                    ) : order.paymentStatus === PaymentStatus.PAID ? (
                      <span className="text-xs text-green-600 font-medium">Verified</span>
                    ) : (
                      <span className="text-xs text-gray-400">Unpaid</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatUsd(order.totalUsd)}</td>
                  <td className="px-4 py-3 text-right text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => goPage(page - 1)}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pg = page <= 3 ? i + 1 : page - 2 + i
              if (pg > totalPages) return null
              return (
                <button
                  key={pg}
                  onClick={() => goPage(pg)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    pg === page ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {pg}
                </button>
              )
            })}
            <button
              onClick={() => goPage(page + 1)}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
