'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { algoliasearch } from 'algoliasearch'
import type { Product, PaginatedResponse } from '@/lib/shared'
import { formatUsd } from '@/lib/shared'
import { useAuth } from '@/contexts/auth-context'
import { useLang } from '@/contexts/language-context'
import { WishlistButton } from '@/components/wishlist-button'

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!,
)

interface Category { id: string; nameEn: string; nameZh?: string; slug: string }

function pickName(en: string, ar?: string | null, zh?: string | null, lang?: string) {
  if ((lang === 'zh-CN' || lang === 'zh-TW') && zh) return zh
  if (lang === 'ar' && ar) return ar
  return en
}

function HomeContent() {
  const { user, loading: authLoading } = useAuth()
  const { t, lang } = useLang()
  const searchParams = useSearchParams()
  const q = searchParams.get('q') ?? ''

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const prevQ = useRef<string | null>(null)
  const PAGE_SIZE = 20

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then((d: { data: Category[] }) => setCategories(d.data))
  }, [])

  useEffect(() => {
    prevQ.current = q
    setLoading(true)
    setPage(1)

    if (q.trim()) {
      const catFilter = activeCat ? `categoryId:${activeCat} AND isActive:true` : 'isActive:true'
      searchClient.searchSingleIndex({
        indexName: 'products',
        searchParams: { query: q, hitsPerPage: 40, filters: catFilter },
      }).then(res => {
        // Algolia hits use objectID; map it to id so ProductCard links work
        const hits = res.hits.map((h: Record<string, unknown>) => ({ ...h, id: h.objectID }))
        setProducts(hits as unknown as Product[])
        setTotal(res.nbHits ?? 0)
      }).finally(() => setLoading(false))
    } else {
      const params = new URLSearchParams({ pageSize: String(PAGE_SIZE), page: '1' })
      if (activeCat) params.set('categoryId', activeCat)
      fetch(`/api/products?${params}`)
        .then(r => r.json())
        .then((d: PaginatedResponse<Product>) => {
          setProducts(d.data)
          setTotal(d.total)
        })
        .finally(() => setLoading(false))
    }
  }, [q, activeCat])

  async function loadMore() {
    if (!q.trim()) {
      setLoadingMore(true)
      const nextPage = page + 1
      const params = new URLSearchParams({ pageSize: String(PAGE_SIZE), page: String(nextPage) })
      if (activeCat) params.set('categoryId', activeCat)
      try {
        const res = await fetch(`/api/products?${params}`)
        const d: PaginatedResponse<Product> = await res.json()
        setProducts(prev => [...prev, ...d.data])
        setPage(nextPage)
      } finally {
        setLoadingMore(false)
      }
    }
  }

  const showHero = !authLoading && !user && !q
  const showWelcome = !authLoading && !!user && !q

  return (
    <div className="min-h-screen">
      {showWelcome && (
        <div className="bg-stone-100 border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">{t.hero.welcome}</p>
              <p className="text-base font-bold text-gray-900">{user.email}</p>
            </div>
            <div className="flex gap-3">
              <Link href="/orders" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">{t.nav.orders}</Link>
              <Link href="/cart" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">{t.nav.cart}</Link>
            </div>
          </div>
        </div>
      )}
      {showHero && (
        <div className="relative h-[520px] overflow-hidden bg-stone-100">
          <Image
            src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600&auto=format&fit=crop&q=80"
            alt="Wholesale products"
            fill className="object-cover object-center" unoptimized priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-16 lg:px-24 max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4 whitespace-pre-line">
              {t.hero.title}
            </h1>
            <p className="text-white/80 text-lg mb-8 whitespace-pre-line">{t.hero.subtitle}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className="px-6 py-3 bg-white text-gray-900 text-sm font-bold rounded-full hover:bg-gray-100 transition-colors">
                {t.hero.signup}
              </Link>
              <Link href="/login" className="px-6 py-3 border border-white text-white text-sm font-semibold rounded-full hover:bg-white/10 transition-colors">
                {t.hero.login}
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide -mx-1 px-1">
            <button
              onClick={() => setActiveCat(null)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
                !activeCat ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
            >
              {t.home.all}
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCat(a => a === c.id ? null : c.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
                  activeCat === c.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                }`}
              >
                {pickName(c.nameEn, undefined, c.nameZh, lang)}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">
            {q ? `${t.home.resultsFor} "${q}"` : activeCat ? pickName(categories.find(c => c.id === activeCat)?.nameEn ?? '', undefined, categories.find(c => c.id === activeCat)?.nameZh, lang) : t.home.featured}
          </h2>
          {!loading && <p className="text-sm text-gray-400">{total} {t.home.products}</p>}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl animate-pulse">
                <div className="aspect-square rounded-t-2xl bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-400">{q ? `${t.home.noProductsFor} "${q}"` : t.home.noProducts}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            {!q && products.length < total && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 transition-colors"
                >
                  {loadingMore ? '…' : `${t.home.loadMore} (${total - products.length} ${t.home.products})`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <HomeContent />
    </Suspense>
  )
}

function ProductCard({ product: p }: { product: Product }) {
  const { t, lang } = useLang()
  const tiers = p.priceTiers as { unitPriceUsd: number; minQty: number }[]
  const minPrice = Math.min(...tiers.map(tier => tier.unitPriceUsd))
  const maxPrice = Math.max(...tiers.map(tier => tier.unitPriceUsd))
  const img = p.images?.[0] ?? 'https://placehold.co/400x400?text=No+Image'
  const displayName = pickName(p.nameEn, p.nameAr, p.nameZh, lang)

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <WishlistButton productId={p.id} />
      </div>
    <Link href={`/products/${p.id}`} className="group block bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-md hover:border-stone-300 transition-all duration-200">
      <div className="aspect-square relative overflow-hidden bg-stone-50">
        <Image src={img} alt={displayName} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
      </div>
      <div className="p-3.5">
        <p className="text-xs text-gray-500 mb-1">
          {formatUsd(minPrice)}{minPrice !== maxPrice ? ` – ${formatUsd(maxPrice)}` : ''}{t.home.perPc}
        </p>
        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{displayName}</p>
        <p className="text-xs text-gray-400 mt-0.5">YiMing B2B · {t.home.moq} {p.moq}</p>
        <div className="mt-3 w-full py-2 rounded-full border border-stone-300 text-xs font-semibold text-gray-700 group-hover:bg-stone-50 flex items-center justify-center gap-1 transition-colors">
          {t.home.viewProduct} →
        </div>
      </div>
    </Link>
    </div>
  )
}
