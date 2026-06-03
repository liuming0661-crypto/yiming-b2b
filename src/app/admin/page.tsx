'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/lib/api'
import { formatUsd } from '@/lib/shared'
import { OrderStatus, PaymentStatus } from '@/lib/shared'

interface MonthlyData { month: string; revenue: number; orders: number }

interface Stats {
  totalOrders: number
  pendingVerification: number
  activeOrders: number
  totalRevenue: number
  totalProducts: number
  totalBuyers: number
  monthlyRevenue: MonthlyData[]
  recentOrders: {
    id: string; orderNumber: string; totalUsd: number
    status: OrderStatus; paymentStatus: PaymentStatus; createdAt: string
    buyer: { companyName: string; country: string }
  }[]
}

const STATUS_COLOR: Record<string, string> = {
  PENDING_PAYMENT: 'bg-gray-100 text-gray-500',
  PAID: 'bg-blue-50 text-blue-700',
  PREPARING: 'bg-amber-50 text-amber-700',
  SHIPPED: 'bg-purple-50 text-purple-700',
  DELIVERED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-500',
}

function RevenueChart({ data }: { data: MonthlyData[] }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)
  const chartH = 120
  const barW = 36
  const gap = 16
  const totalW = data.length * (barW + gap) - gap

  function shortMonth(ym: string) {
    const [y, m] = ym.split('-')
    return new Date(Number(y), Number(m) - 1).toLocaleString('en-US', { month: 'short' })
  }

  function fmtK(v: number) {
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`
    return `$${v.toFixed(0)}`
  }

  return (
    <div className="overflow-x-auto">
      <svg width={totalW + 40} height={chartH + 56} className="block mx-auto">
        {/* Y-axis gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const y = chartH - pct * chartH
          return (
            <g key={pct}>
              <line x1={0} y1={y} x2={totalW + 40} y2={y} stroke="#f3f4f6" strokeWidth={1} />
              {pct > 0 && (
                <text x={0} y={y - 3} fontSize={9} fill="#9ca3af">{fmtK(maxRevenue * pct)}</text>
              )}
            </g>
          )
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const x = i * (barW + gap) + 20
          const barH = (d.revenue / maxRevenue) * chartH
          const y = chartH - barH
          const hasData = d.revenue > 0
          return (
            <g key={d.month}>
              <rect
                x={x} y={hasData ? y : chartH - 2}
                width={barW} height={hasData ? barH : 2}
                rx={4} fill={hasData ? '#111827' : '#e5e7eb'}
              />
              {hasData && (
                <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={9} fill="#374151" fontWeight="600">
                  {fmtK(d.revenue)}
                </text>
              )}
              <text x={x + barW / 2} y={chartH + 16} textAnchor="middle" fontSize={10} fill="#6b7280">
                {shortMonth(d.month)}
              </text>
              <text x={x + barW / 2} y={chartH + 30} textAnchor="middle" fontSize={9} fill="#9ca3af">
                {d.orders > 0 ? `${d.orders} order${d.orders > 1 ? 's' : ''}` : '—'}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default function AdminDashboard() {
  const { token } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    api.get<{ data: Stats }>('/api/admin/stats', token)
      .then(r => setStats(r.data))
      .finally(() => setLoading(false))
  }, [token])

  const cards = stats ? [
    { label: 'Total Revenue', value: formatUsd(stats.totalRevenue), sub: 'verified payments', color: 'text-green-600' },
    { label: 'Pending Review', value: stats.pendingVerification, sub: 'receipts to verify', color: stats.pendingVerification > 0 ? 'text-amber-600' : 'text-gray-900', href: '/admin/orders?filter=pending' },
    { label: 'Active Orders', value: stats.activeOrders, sub: 'paid · preparing · shipped', color: 'text-blue-600' },
    { label: 'Total Orders', value: stats.totalOrders, sub: 'all time', color: 'text-gray-900' },
    { label: 'Products', value: stats.totalProducts, sub: 'active listings', color: 'text-gray-900', href: '/admin/products' },
    { label: 'Buyers', value: stats.totalBuyers, sub: 'registered accounts', color: 'text-gray-900' },
  ] : []

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Overview of your platform</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {cards.map(c => (
            <div key={c.label} className={`bg-white rounded-2xl border border-gray-100 p-5 ${c.href ? 'hover:border-gray-300 transition-colors cursor-pointer' : ''}`}
              onClick={() => c.href && (window.location.href = c.href)}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{c.label}</p>
              <p className={`text-3xl font-black ${c.color}`}>{c.value}</p>
              <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Revenue chart */}
      {stats && stats.monthlyRevenue.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-gray-900">Monthly Revenue (USD)</h2>
            <span className="text-xs text-gray-400">Last 6 months · Verified payments</span>
          </div>
          <RevenueChart data={stats.monthlyRevenue} />
        </div>
      )}

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">View all →</Link>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {(stats?.recentOrders ?? []).map(o => (
              <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{o.orderNumber}</p>
                  <p className="text-xs text-gray-400 truncate">{o.buyer.companyName} · {o.buyer.country}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLOR[o.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {o.status.replace('_', ' ')}
                </span>
                <p className="text-sm font-bold text-gray-900 shrink-0">{formatUsd(o.totalUsd)}</p>
              </Link>
            ))}
            {stats?.recentOrders.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-10">No orders yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
