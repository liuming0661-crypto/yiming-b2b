'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useLang } from '@/contexts/language-context'
import { useCart } from '@/contexts/cart-context'
import { api } from '@/lib/api'
import { formatUsd, getPriceForQty, calcSubtotal } from '@/lib/shared'
import type { Product, PaginatedResponse } from '@/lib/shared'
import { InquiryModal } from '@/components/inquiry-modal'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, token } = useAuth()
  const { t, lang } = useLang()

  function pickName(en: string, _ar?: string | null, zh?: string | null) {
    if ((lang === 'zh-CN' || lang === 'zh-TW') && zh) return zh
    return en
  }
  const { increment: incrementCart } = useCart()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [quantity, setQuantity] = useState(0)
  const [activeImg, setActiveImg] = useState(0)
  const [adding, setAdding] = useState(false)
  const [addedMsg, setAddedMsg] = useState('')
  const [fetchError, setFetchError] = useState(false)
  const [showInquiry, setShowInquiry] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setProduct(null)
    setRelated([])
    setFetchError(false)
    fetch(`/api/products/${id}`, { signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        if (!d.data) { setFetchError(true); return }
        setProduct(d.data)
        setQuantity(d.data.moq)
        fetch(`/api/products?categoryId=${d.data.categoryId}&pageSize=4`, { signal: controller.signal })
          .then(r => r.json())
          .then((rd: PaginatedResponse<Product>) =>
            setRelated(rd.data.filter((p: Product) => p.id !== d.data.id).slice(0, 3))
          )
          .catch(() => {})
      })
      .catch(err => { if (err.name !== 'AbortError') setFetchError(true) })
    return () => controller.abort()
  }, [id])

  if (fetchError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <p className="text-7xl font-black text-stone-200 mb-4 select-none">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.notFound.title}</h1>
        <p className="text-gray-500 text-sm mb-8">{t.notFound.message}</p>
        <Link href="/" className="px-6 py-3 bg-gray-900 text-white text-sm font-bold rounded-full hover:bg-gray-700 transition-colors">
          {t.notFound.back}
        </Link>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid md:grid-cols-2 gap-10 animate-pulse">
          <div className="aspect-square bg-gray-100 rounded-2xl" />
          <div className="space-y-4 pt-4">
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-7 bg-gray-100 rounded w-3/4" />
            <div className="h-32 bg-gray-100 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  const unitPrice = getPriceForQty(product.priceTiers, quantity)
  const subtotal = calcSubtotal(product.priceTiers, quantity)

  async function addToCart() {
    if (!user) { router.push('/login'); return }
    setAdding(true)
    try {
      await api.post('/api/cart/items', token, { productId: product!.id, quantity })
      incrementCart(quantity)
      setAddedMsg(t.product.addedToCart)
      setTimeout(() => setAddedMsg(''), 2500)
    } catch (err: unknown) {
      setAddedMsg(err instanceof Error ? err.message : 'Failed to add')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-gray-700 transition-colors">{t.product.back}</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium truncate max-w-xs">{pickName(product.nameEn, product.nameAr, product.nameZh)}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          <div>
            <div className="aspect-square relative rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
              <Image
                src={product.images[activeImg] ?? 'https://placehold.co/600x600?text=No+Image'}
                alt={pickName(product.nameEn, product.nameAr, product.nameZh)} fill className="object-cover" unoptimized priority
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 mt-3">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 relative rounded-xl overflow-hidden border-2 transition-colors ${i === activeImg ? 'border-gray-900' : 'border-gray-100 hover:border-gray-300'}`}
                  >
                    <Image src={img} alt="" fill className="object-cover" unoptimized />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <p className="text-xs text-gray-400 font-mono mb-2">{t.product.sku}: {product.sku}</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-6 leading-snug">{pickName(product.nameEn, product.nameAr, product.nameZh)}</h1>

            <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">{t.product.volumePricing}</p>
              <div className="space-y-2">
                {product.priceTiers.map((tier, i) => {
                  const active = quantity >= tier.minQty
                  return (
                    <div key={i} className={`flex items-center justify-between py-1.5 px-3 rounded-xl text-sm transition-colors ${active ? 'bg-gray-900 text-white' : 'text-gray-500'}`}>
                      <span className="font-medium">{tier.minQty}+ {t.product.pcs}</span>
                      <span className="font-bold">{formatUsd(tier.unitPriceUsd)}{t.product.perPc}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                {t.product.quantity} <span className="text-gray-400 font-normal">({t.product.min} {product.moq} {t.product.pcs})</span>
              </label>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity(q => Math.max(product.moq, q - product.moq))}
                  className="w-10 h-10 rounded-full border border-gray-200 text-xl font-light hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center">−</button>
                <input type="number" value={quantity} min={product.moq} step={product.moq}
                  onChange={e => setQuantity(Math.max(product.moq, Number(e.target.value)))}
                  className="w-24 text-center rounded-xl border border-gray-200 px-2 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-gray-900" />
                <button onClick={() => setQuantity(q => q + product.moq)}
                  className="w-10 h-10 rounded-full border border-gray-200 text-xl font-light hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center">+</button>
              </div>
            </div>

            <div className="flex justify-between items-center py-4 border-t border-gray-100 mb-5">
              <span className="text-sm text-gray-500">{formatUsd(unitPrice)}{t.product.perPc} × {quantity} {t.product.pcs}</span>
              <span className="text-2xl font-black text-gray-900">{formatUsd(subtotal)}</span>
            </div>

            <button onClick={addToCart} disabled={adding}
              className="w-full py-4 rounded-full bg-gray-900 text-white font-bold text-sm hover:bg-gray-700 disabled:opacity-50 transition-colors">
              {adding ? t.product.adding : user ? t.product.addToCart : t.product.loginToOrder}
            </button>

            {addedMsg && (
              <p className={`text-center text-sm mt-3 font-medium ${addedMsg.includes('!') || addedMsg.includes('！') ? 'text-green-600' : 'text-red-500'}`}>
                {addedMsg}
              </p>
            )}

            {!user && (
              <>
                <button
                  onClick={() => setShowInquiry(true)}
                  className="w-full py-3 mt-3 rounded-full border-2 border-gray-900 text-gray-900 font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  {t.inquiry?.button ?? 'Request a Quote'}
                </button>
                <p className="text-center text-xs text-gray-400 mt-3">
                  <Link href="/register" className="text-gray-700 underline hover:no-underline">{t.product.createAccount}</Link>
                  {' '}{t.product.toPlaceOrder}
                </p>
              </>
            )}

            {showInquiry && (
              <InquiryModal
                productId={product.id}
                productName={pickName(product.nameEn, product.nameAr, product.nameZh)}
                defaultQty={quantity}
                onClose={() => setShowInquiry(false)}
              />
            )}

            {(product.descEn || product.descZh) && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">{t.product.description}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{pickName(product.descEn ?? '', product.descAr, product.descZh)}</p>
              </div>
            )}

            {product.specs && Object.keys(product.specs).filter(k => product.specs![k]).length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">{t.product.specs}</p>
                <dl className="divide-y divide-gray-50">
                  {Object.entries(product.specs).filter(([, v]) => v).map(([key, value]) => (
                    <div key={key} className="flex py-2 text-sm">
                      <dt className="w-32 shrink-0 text-gray-400 capitalize">{key}</dt>
                      <dd className="text-gray-700 font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-14 pt-10 border-t border-stone-200">
            <h2 className="text-lg font-bold text-gray-900 mb-5">{t.product.relatedProducts}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {related.map(p => {
                const minPrice = Math.min(...(p.priceTiers as { unitPriceUsd: number }[]).map(t => t.unitPriceUsd))
                const img = p.images?.[0] ?? 'https://placehold.co/400x400?text=No+Image'
                return (
                  <Link key={p.id} href={`/products/${p.id}`} className="group block bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-md hover:border-stone-300 transition-all">
                    <div className="aspect-square relative overflow-hidden bg-stone-50">
                      <Image src={img} alt={pickName(p.nameEn, p.nameAr, p.nameZh)} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                    </div>
                    <div className="p-3.5">
                      <p className="text-xs text-gray-500">{formatUsd(minPrice)}{t.home.perPc}</p>
                      <p className="text-sm font-medium text-gray-900 line-clamp-2 mt-0.5">{pickName(p.nameEn, p.nameAr, p.nameZh)}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
