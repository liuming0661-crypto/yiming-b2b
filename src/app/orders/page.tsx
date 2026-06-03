'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLang } from '@/contexts/language-context'
import { api } from '@/lib/api'
import { formatUsd } from '@/lib/shared'
import { OrderStatus, PaymentStatus } from '@/lib/shared'

interface OrderSummary {
  id: string
  orderNumber: string
  status: OrderStatus
  paymentMethod: string
  paymentStatus: PaymentStatus
  totalUsd: number
  createdAt: string
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

const PAGE_SIZE = 10

export default function OrdersPage() {
  const { user, token, loading: authLoading } = useAuth()
  const { t, formatDate } = useLang()
  const router = useRouter()
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    if (!token) return
    setLoading(true)
    api.get<{ data: OrderSummary[]; total: number }>(`/api/orders?page=1&pageSize=${PAGE_SIZE}`, token)
      .then(res => { setOrders(res.data); setTotal(res.total); setPage(1) })
      .finally(() => setLoading(false))
  }, [user, token, authLoading])

  async function loadMore() {
    if (!token) return
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      const res = await api.get<{ data: OrderSummary[]; total: number }>(`/api/orders?page=${nextPage}&pageSize=${PAGE_SIZE}`, token)
      setOrders(prev => [...prev, ...res.data])
      setPage(nextPage)
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-8 bg-gray-100 rounded w-40 mb-6 animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.orders.title}</h1>
        {total > 0 && <p className="text-sm text-gray-400">{total} {t.orders.order}</p>}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">{t.orders.empty}</p>
          <Link href="/" className="inline-block px-6 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
            {t.cart.browseProducts}
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map(order => (
              <Link key={order.id} href={`/orders/${order.id}`}
                className="block bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm hover:border-gray-200 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order._count.items} {t.cart.items} · {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-900">{formatUsd(order.totalUsd)}</p>
                    <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full mt-1 font-medium ${STATUS_COLOR[order.status]}`}>
                      {t.orders.status[order.status] ?? order.status}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                  <span>{t.orders.payment}: {t.orders.paymentStatus[order.paymentStatus] ?? order.paymentStatus}</span>
                  <span className="text-gray-700 font-medium">{t.orders.viewDetails}</span>
                </div>
              </Link>
            ))}
          </div>

          {orders.length < total && (
            <div className="text-center mt-6">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-full border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {loadingMore ? '…' : t.home.loadMore}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
