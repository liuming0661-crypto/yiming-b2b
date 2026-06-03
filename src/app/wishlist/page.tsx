'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useWishlist } from '@/hooks/use-wishlist'
import { WishlistButton } from '@/components/wishlist-button'
import { useLang } from '@/contexts/language-context'
import { formatUsd } from '@/lib/shared'
import type { Product } from '@/lib/shared'

export default function WishlistPage() {
  const { ids } = useWishlist()
  const { lang, t } = useLang()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  function pickName(en: string, _ar?: string | null, zh?: string | null) {
    if ((lang === 'zh-CN' || lang === 'zh-TW') && zh) return zh
    return en
  }

  useEffect(() => {
    if (ids.length === 0) { setLoading(false); return }
    Promise.all(ids.map(id => fetch(`/api/products/${id}`).then(r => r.json()).then(d => d.data).catch(() => null)))
      .then(results => setProducts(results.filter(Boolean)))
      .finally(() => setLoading(false))
  }, [ids.join(',')])

  const title = lang === 'zh-CN' ? '我的收藏' : lang === 'zh-TW' ? '我的收藏' : 'Saved Products'
  const empty = lang === 'zh-CN' ? '还没有收藏商品' : lang === 'zh-TW' ? '還沒有收藏商品' : 'No saved products yet'
  const browse = lang === 'zh-CN' ? '浏览商品' : lang === 'zh-TW' ? '瀏覽商品' : 'Browse Products'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{title}</h1>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">🤍</p>
          <p className="text-gray-500 mb-6">{empty}</p>
          <Link href="/" className="px-6 py-3 bg-gray-900 text-white text-sm font-bold rounded-full hover:bg-gray-700 transition-colors">
            {browse}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => {
            const tiers = p.priceTiers as { unitPriceUsd: number; minQty: number }[]
            const minPrice = Math.min(...tiers.map(t => t.unitPriceUsd))
            const maxPrice = Math.max(...tiers.map(t => t.unitPriceUsd))
            const img = p.images?.[0] ?? 'https://placehold.co/400x400?text=No+Image'
            const name = pickName(p.nameEn, p.nameAr, p.nameZh)
            return (
              <div key={p.id} className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <WishlistButton productId={p.id} />
                </div>
                <Link href={`/products/${p.id}`} className="group block bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-md hover:border-stone-300 transition-all">
                  <div className="aspect-square relative overflow-hidden bg-stone-50">
                    <Image src={img} alt={name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                  </div>
                  <div className="p-3.5">
                    <p className="text-xs text-gray-500 mb-1">
                      {formatUsd(minPrice)}{minPrice !== maxPrice ? ` – ${formatUsd(maxPrice)}` : ''}{t.home.perPc}
                    </p>
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">YiMing B2B · {t.home.moq} {p.moq}</p>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
