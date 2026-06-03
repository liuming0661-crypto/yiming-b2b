'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/lib/api'

interface Category {
  id: string
  nameEn: string
  nameAr: string
  slug: string
  sortOrder: number
  _count: { products: number }
}

const inputClass = "rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

export default function CategoriesPage() {
  const { token } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)

  const [nameEn, setNameEn] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [slug, setSlug] = useState('')
  const [sortOrder, setSortOrder] = useState(0)

  async function load() {
    if (!token) return
    const res = await api.get<{ data: Category[] }>('/api/admin/categories', token)
    setCategories(res.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [token])

  function startEdit(c: Category) {
    setEditId(c.id)
    setNameEn(c.nameEn)
    setNameAr(c.nameAr)
    setSlug(c.slug)
    setSortOrder(c.sortOrder)
    setShowNew(false)
    setError('')
  }

  function startNew() {
    setShowNew(true)
    setEditId(null)
    setNameEn('')
    setNameAr('')
    setSlug('')
    setSortOrder(0)
    setError('')
  }

  function cancel() {
    setShowNew(false)
    setEditId(null)
    setError('')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setError('')
    try {
      await api.post('/api/admin/categories', token, { nameEn, nameAr, ...(slug ? { slug } : {}), sortOrder })
      setShowNew(false)
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !editId) return
    setSaving(true)
    setError('')
    try {
      await api.put(`/api/admin/categories/${editId}`, token, { nameEn, nameAr, sortOrder })
      setEditId(null)
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!token || !confirm(`Delete "${name}"?`)) return
    try {
      await api.del(`/api/admin/categories/${id}`, token)
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  if (loading) return <div className="p-6 text-gray-400">Loading…</div>

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Categories</h1>
        {!showNew && !editId && (
          <button onClick={startNew} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            + New Category
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">{error}</div>
      )}

      {/* New category form */}
      {showNew && (
        <form onSubmit={handleCreate} className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-5 space-y-3">
          <p className="text-sm font-semibold text-blue-900">New Category</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name (EN) *</label>
              <input required value={nameEn} onChange={e => setNameEn(e.target.value)} className={inputClass + ' w-full'} placeholder="e.g. Toys & Games" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name (AR)</label>
              <input value={nameAr} onChange={e => setNameAr(e.target.value)} className={inputClass + ' w-full'} dir="rtl" placeholder="الألعاب" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Slug <span className="text-gray-400 font-normal">(auto if blank)</span></label>
              <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} className={inputClass + ' w-full'} placeholder="auto-generated" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sort Order</label>
              <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className={inputClass + ' w-full'} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={cancel} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {/* Category list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Slug</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Products</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sort</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                {editId === c.id ? (
                  <td colSpan={5} className="px-4 py-3">
                    <form onSubmit={handleUpdate} className="flex gap-2 items-center flex-wrap">
                      <input required value={nameEn} onChange={e => setNameEn(e.target.value)} className={inputClass + ' flex-1 min-w-24'} placeholder="Name EN" />
                      <input value={nameAr} onChange={e => setNameAr(e.target.value)} className={inputClass + ' flex-1 min-w-24'} dir="rtl" placeholder="اسم" />
                      <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className={inputClass + ' w-20'} placeholder="Sort" />
                      <button type="button" onClick={cancel} className="px-3 py-2 text-xs border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                      <button type="submit" disabled={saving} className="px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {saving ? '…' : 'Save'}
                      </button>
                    </form>
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {c.nameEn}
                      {c.nameAr && <span className="text-gray-400 ml-2 text-xs" dir="rtl">{c.nameAr}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{c.slug}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{c._count.products}</td>
                    <td className="px-4 py-3 text-center text-gray-400">{c.sortOrder}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => startEdit(c)} className="text-xs text-blue-600 hover:underline">Edit</button>
                        {c._count.products === 0 && (
                          <button onClick={() => handleDelete(c.id, c.nameEn)} className="text-xs text-red-500 hover:underline">Delete</button>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">No categories yet. Create one above.</div>
        )}
      </div>
    </div>
  )
}
