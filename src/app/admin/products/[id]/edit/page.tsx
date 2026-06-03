'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/lib/api'
import { ImageUploader } from '@/components/image-uploader'

interface Category { id: string; nameEn: string }
interface PriceTier { minQty: number; unitPriceUsd: number }

const inputClass = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
const labelClass = "block text-sm font-medium text-gray-700 mb-1"

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [sku, setSku] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [nameZh, setNameZh] = useState('')
  const [descEn, setDescEn] = useState('')
  const [descAr, setDescAr] = useState('')
  const [descZh, setDescZh] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [moq, setMoq] = useState(100)
  const [isActive, setIsActive] = useState(true)
  const [images, setImages] = useState<string[]>([])
  const [tiers, setTiers] = useState<PriceTier[]>([])
  const [specsText, setSpecsText] = useState('')

  useEffect(() => {
    if (!token) return
    Promise.all([
      api.get<{ data: { id: string; sku: string; nameEn: string; nameAr: string; nameZh: string | null; descEn: string | null; descAr: string | null; descZh: string | null; categoryId: string; moq: number; isActive: boolean; images: string[]; priceTiers: PriceTier[]; specs?: Record<string, string> } }>(`/api/admin/products/${id}`, token),
      api.get<{ data: Category[] }>('/api/admin/categories', token),
    ]).then(([prod, cats]) => {
      const p = prod.data
      setSku(p.sku)
      setNameEn(p.nameEn)
      setNameAr(p.nameAr ?? '')
      setNameZh(p.nameZh ?? '')
      setDescEn(p.descEn ?? '')
      setDescAr(p.descAr ?? '')
      setDescZh(p.descZh ?? '')
      setCategoryId(p.categoryId)
      setMoq(p.moq)
      setIsActive(p.isActive)
      setImages(p.images)
      setTiers(p.priceTiers)
      setCategories(cats.data)
      if (p.specs) {
        setSpecsText(Object.entries(p.specs).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n'))
      }
    }).finally(() => setLoading(false))
  }, [token, id])

  function updateTier(i: number, field: keyof PriceTier, value: string) {
    setTiers(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: Number(value) } : t))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setError('')
    setSaving(true)
    try {
      const specs = Object.fromEntries(
        specsText.split('\n')
          .map(l => l.split(':').map(s => s.trim()))
          .filter(([k, v]) => k && v)
          .map(([k, v]) => [k, v])
      )
      await api.put(`/api/admin/products/${id}`, token, {
        nameEn, nameAr, nameZh, descEn, descAr, descZh, categoryId,
        moq, isActive, images, priceTiers: tiers,
        specs: Object.keys(specs).length > 0 ? specs : {},
      })
      router.push('/admin/products')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6 text-gray-400">Loading…</div>

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-800">← Back</button>
        <h1 className="text-xl font-bold text-gray-900">Edit Product</h1>
        <span className="text-sm text-gray-400">{sku}</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelClass}>Category *</label>
          <select required value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputClass}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass}>Name (English) *</label>
          <input required value={nameEn} onChange={e => setNameEn(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Name (Chinese 中文)</label>
          <input value={nameZh} onChange={e => setNameZh(e.target.value)} className={inputClass} placeholder="产品中文名称" />
        </div>

        <div>
          <label className={labelClass}>Name (Arabic)</label>
          <input value={nameAr} onChange={e => setNameAr(e.target.value)} className={inputClass} dir="rtl" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>MOQ (pcs) *</label>
            <input required type="number" min={1} value={moq} onChange={e => setMoq(Number(e.target.value))} className={inputClass} />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>
        </div>

        {/* Price Tiers */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={labelClass + ' mb-0'}>Price Tiers *</label>
            <button type="button" onClick={() => setTiers(p => [...p, { minQty: 0, unitPriceUsd: 0 }])} className="text-xs text-blue-600 hover:underline">+ Add tier</button>
          </div>
          <div className="space-y-2">
            {tiers.map((t, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="number" min={1} placeholder="Min qty" value={t.minQty || ''} onChange={e => updateTier(i, 'minQty', e.target.value)} className={inputClass + ' flex-1'} />
                <input type="number" min={0} step={0.01} placeholder="Price USD" value={t.unitPriceUsd || ''} onChange={e => updateTier(i, 'unitPriceUsd', e.target.value)} className={inputClass + ' flex-1'} />
                {tiers.length > 1 && (
                  <button type="button" onClick={() => setTiers(p => p.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-400 text-xl leading-none shrink-0">×</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Product Images</label>
          <ImageUploader images={images} onChange={setImages} token={token} />
        </div>

        <div>
          <label className={labelClass}>Specifications <span className="text-gray-400 font-normal text-xs">(one per line: key: value)</span></label>
          <textarea
            value={specsText}
            onChange={e => setSpecsText(e.target.value)}
            className={inputClass + ' h-20 resize-none font-mono text-xs'}
            placeholder={"Material: Stainless Steel\nWeight: 500g\nOrigin: Yiwu, China"}
          />
        </div>

        <div>
          <label className={labelClass}>Description (English)</label>
          <textarea value={descEn} onChange={e => setDescEn(e.target.value)} className={inputClass + ' h-20 resize-none'} />
        </div>
        <div>
          <label className={labelClass}>Description (Chinese 中文描述)</label>
          <textarea value={descZh} onChange={e => setDescZh(e.target.value)} className={inputClass + ' h-20 resize-none'} placeholder="产品中文描述…" />
        </div>

        <div>
          <label className={labelClass}>Description (Arabic)</label>
          <textarea value={descAr} onChange={e => setDescAr(e.target.value)} className={inputClass + ' h-20 resize-none'} dir="rtl" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
