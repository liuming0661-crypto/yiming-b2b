'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/lib/api'
import { formatUsd } from '@/lib/shared'
import { useDebounce } from '@/hooks/useDebounce'

interface AdminProduct {
  id: string
  sku: string
  nameEn: string
  moq: number
  priceTiers: { minQty: number; unitPriceUsd: number }[]
  images: string[]
  isActive: boolean
  createdAt: string
  category: { nameEn: string; slug: string }
}

const PAGE_SIZE = 20

export default function AdminProductsPage() {
  const { token } = useAuth()
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 400)

  async function load(q: string, pg: number) {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pg), pageSize: String(PAGE_SIZE) })
      if (q) params.set('q', q)
      const res = await api.get<{ data: AdminProduct[]; total: number }>(`/api/admin/products?${params.toString()}`, token)
      setProducts(res.data)
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

  async function toggleActive(p: AdminProduct) {
    if (!token) return
    setToggling(p.id)
    try {
      await api.put(`/api/admin/products/${p.id}`, token, { isActive: !p.isActive })
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, isActive: !p.isActive } : x))
    } finally {
      setToggling(null)
    }
  }

  async function deleteProduct(p: AdminProduct) {
    if (!token) return
    if (!confirm(`Delete "${p.nameEn}"? This cannot be undone.`)) return
    setDeleting(p.id)
    try {
      await api.del(`/api/admin/products/${p.id}`, token)
      setProducts(prev => prev.filter(x => x.id !== p.id))
      setTotal(t => t - 1)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or SKU…"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
          />
          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            + New Product
          </Link>
        </div>
      </div>

      {loading && products.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">MOQ</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">From</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map(p => {
                const minPrice = Math.min(...p.priceTiers.map(t => t.unitPriceUsd))
                const img = p.images[0] ?? 'https://placehold.co/48x48?text=?'
                return (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${!p.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          <Image src={img} alt={p.nameEn} fill className="object-cover" unoptimized />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 max-w-xs truncate">{p.nameEn}</p>
                          <p className="text-xs text-gray-400">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.category?.nameEn}</td>
                    <td className="px-4 py-3 text-gray-600">{p.moq} pcs</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatUsd(minPrice)}/pc</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(p)}
                        disabled={toggling === p.id}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          p.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {toggling === p.id ? '…' : p.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteProduct(p)}
                          disabled={deleting === p.id}
                          className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors"
                        >
                          {deleting === p.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">
              {search ? 'No products match your search.' : 'No products yet.'}
            </div>
          )}
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
