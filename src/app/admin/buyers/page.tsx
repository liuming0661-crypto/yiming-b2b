'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/lib/api'
import { useDebounce } from '@/hooks/useDebounce'

interface Buyer {
  id: string
  email: string
  companyName: string
  contactName: string
  country: string
  phone: string | null
  status: string
  createdAt: string
  _count: { orders: number }
}

const PAGE_SIZE = 20

export default function AdminBuyersPage() {
  const { token } = useAuth()
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 400)

  async function load(q: string, pg: number) {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pg), pageSize: String(PAGE_SIZE) })
      if (q) params.set('q', q)
      const res = await api.get<{ data: Buyer[]; total: number }>(`/api/admin/buyers?${params.toString()}`, token)
      setBuyers(res.data)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    setPage(1)
    load(debouncedSearch, 1)
  }, [token, debouncedSearch])

  function goPage(pg: number) {
    setPage(pg)
    load(debouncedSearch, pg)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (loading && buyers.length === 0) return <div className="p-6 text-gray-400">Loading…</div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Buyers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} registered buyers</p>
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by email, company or country…"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Country</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Orders</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {buyers.map(b => (
              <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/admin/buyers/${b.id}`} className="font-medium text-blue-600 hover:underline truncate max-w-[180px] block">{b.companyName}</Link>
                  <p className="text-xs text-gray-400 truncate">{b.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{b.contactName}</td>
                <td className="px-4 py-3">
                  <span className="inline-block bg-stone-100 text-stone-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase">
                    {b.country}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-semibold text-gray-700">{b._count.orders}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    b.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(b.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {buyers.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">
            {search ? 'No buyers match your search.' : 'No buyers registered yet.'}
          </div>
        )}
      </div>

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
