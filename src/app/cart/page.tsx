'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLang } from '@/contexts/language-context'
import { useCart } from '@/contexts/cart-context'
import { api } from '@/lib/api'
import { formatUsd, MIN_ORDER_USD } from '@/lib/shared'
import type { CartItem } from '@/lib/shared'

interface CartData {
  items: CartItem[]
  total: number
}

interface Address {
  id: string
  fullName: string
  company: string | null
  line1: string
  city: string
  country: string
  isDefault: boolean
}

export default function CartPage() {
  const { user, token, loading: authLoading } = useAuth()
  const { t } = useLang()
  const { refresh: refreshCartCount, reset: resetCartCount } = useCart()
  const router = useRouter()
  const [cart, setCart] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState('')
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddrId, setSelectedAddrId] = useState('')

  async function loadCart() {
    if (!token) return
    try {
      const [cartRes, addrRes] = await Promise.all([
        api.get<{ data: CartData }>('/api/cart', token),
        api.get<{ data: Address[] }>('/api/addresses', token),
      ])
      setCart(cartRes.data)
      setAddresses(addrRes.data)
      const def = addrRes.data.find(a => a.isDefault)
      if (def) setSelectedAddrId(def.id)
    } finally {
      setLoading(false)
    }
  }

  async function loadCartAndRefreshCount() {
    await loadCart()
    refreshCartCount()
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    loadCart()
  }, [user, token, authLoading])

  async function updateQty(productId: string, quantity: number) {
    if (!token) return
    try {
      await api.put(`/api/cart/items/${productId}`, token, { quantity })
      loadCartAndRefreshCount()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update quantity')
    }
  }

  async function removeItem(productId: string) {
    if (!token) return
    try {
      await api.del(`/api/cart/items/${productId}`, token)
      loadCartAndRefreshCount()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove item')
    }
  }

  async function placeOrder() {
    if (!token) return
    setPlacing(true)
    setError('')
    try {
      const res = await api.post<{ data: { id: string } }>('/api/orders', token, {
        paymentMethod: 'TT_WIRE',
        notes: notes || undefined,
        shippingAddrId: selectedAddrId || undefined,
      })
      resetCartCount()
      router.push(`/orders/${res.data.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to place order')
      setPlacing(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>
  }

  const items = cart?.items ?? []
  const total = cart?.total ?? 0
  const meetsMinimum = total >= MIN_ORDER_USD

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-5">
          <svg className="w-9 h-9 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">{t.cart.empty}</h2>
        <Link href="/" className="inline-block mt-4 px-6 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
          {t.cart.browseProducts}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t.cart.title}</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => (
            <CartItemRow
              key={item.productId}
              item={item}
              onUpdateQty={updateQty}
              onRemove={removeItem}
              t={t}
            />
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 sticky top-20">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{t.cart.subtotal}</h2>

            <div className="space-y-2 mb-4">
              {items.map(item => (
                <div key={item.productId} className="flex justify-between text-sm text-gray-600">
                  <span className="truncate pr-2">{item.product.nameEn} ×{item.quantity}</span>
                  <span className="shrink-0 font-medium">{formatUsd(item.subtotalUsd)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-100 pt-3 mb-5">
              <div className="flex justify-between font-bold text-gray-900">
                <span>{t.cart.total}</span>
                <span className="text-lg">{formatUsd(total)}</span>
              </div>
              {!meetsMinimum && (
                <p className="text-xs text-amber-600 mt-2 leading-relaxed">
                  {t.cart.minOrderNote} {formatUsd(total)}
                </p>
              )}
            </div>

            {addresses.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Shipping Address</label>
                <select
                  value={selectedAddrId}
                  onChange={e => setSelectedAddrId(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                >
                  <option value="">— No address —</option>
                  {addresses.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.fullName}{a.company ? ` (${a.company})` : ''} · {a.line1}, {a.city}, {a.country}
                    </option>
                  ))}
                </select>
                <Link href="/account" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                  Manage addresses →
                </Link>
              </div>
            )}

            {addresses.length === 0 && (
              <div className="mb-4 text-xs text-gray-400">
                <Link href="/account" className="text-blue-600 hover:underline">Add a shipping address</Link> to your order
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">{t.cart.notes}</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder={t.cart.notesPlaceholder}
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <button
              onClick={placeOrder}
              disabled={placing || !meetsMinimum}
              className="w-full py-3.5 rounded-full bg-gray-900 text-white font-bold text-sm hover:bg-gray-700 disabled:opacity-40 transition-colors"
            >
              {placing ? t.cart.placing : t.cart.placeOrder}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              {t.orderDetail.ttWire}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CartItemRow({
  item,
  onUpdateQty,
  onRemove,
  t,
}: {
  item: CartItem
  onUpdateQty: (productId: string, qty: number) => void
  onRemove: (productId: string) => void
  t: ReturnType<typeof useLang>['t']
}) {
  const { product } = item
  const img = product.images[0] ?? 'https://placehold.co/80x80?text=No+Image'

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 flex gap-4">
      <Link href={`/products/${item.productId}`} className="w-18 h-18 relative rounded-xl overflow-hidden bg-stone-50 shrink-0 block" style={{ width: 72, height: 72 }}>
        <Image src={img} alt={product.nameEn} fill className="object-cover" unoptimized />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/products/${item.productId}`} className="text-sm font-semibold text-gray-900 truncate hover:underline block">{product.nameEn}</Link>
        <p className="text-xs text-gray-400 mt-0.5">SKU: {product.sku}</p>
        <p className="text-xs text-gray-500 mt-0.5">{formatUsd(item.unitPriceUsd)}{t.cart.perPc}</p>
        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={() => onUpdateQty(item.productId, Math.max(product.moq, item.quantity - product.moq))}
            className="w-7 h-7 rounded-lg border border-stone-300 text-sm font-medium hover:bg-stone-50 transition-colors flex items-center justify-center"
          >−</button>
          <span className="text-sm font-semibold w-10 text-center">{item.quantity}</span>
          <button
            onClick={() => onUpdateQty(item.productId, item.quantity + product.moq)}
            className="w-7 h-7 rounded-lg border border-stone-300 text-sm font-medium hover:bg-stone-50 transition-colors flex items-center justify-center"
          >+</button>
        </div>
      </div>
      <div className="flex flex-col items-end justify-between shrink-0">
        <button
          onClick={() => onRemove(item.productId)}
          className="text-stone-300 hover:text-red-400 transition-colors text-xl leading-none"
        >×</button>
        <p className="text-sm font-bold text-gray-900">{formatUsd(item.subtotalUsd)}</p>
      </div>
    </div>
  )
}
