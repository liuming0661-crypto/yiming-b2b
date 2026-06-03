'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLang } from '@/contexts/language-context'
import { api } from '@/lib/api'
import { formatUsd } from '@/lib/shared'
import { OrderStatus } from '@/lib/shared'
import { LANG_LABELS, type Lang } from '@/lib/i18n'

interface UserProfile {
  id: string
  email: string
  companyName: string
  contactName: string
  country: string
  phone: string | null
  createdAt: string
}

interface Address {
  id: string
  fullName: string
  company: string | null
  line1: string
  line2: string | null
  city: string
  state: string | null
  postalCode: string
  country: string
  isDefault: boolean
}

interface OrderSummary {
  id: string
  orderNumber: string
  status: OrderStatus
  totalUsd: number
  createdAt: string
  _count: { items: number }
}

const STATUS_COLOR: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
  PAID: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  CUSTOMS: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-400',
}

export default function AccountPage() {
  const { user, token, loading: authLoading } = useAuth()
  const { lang, setLang, t, formatDate } = useLang()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const [editCompany, setEditCompany] = useState('')
  const [editContact, setEditContact] = useState('')
  const [editPhone, setEditPhone] = useState('')

  const [addresses, setAddresses] = useState<Address[]>([])
  const [addingAddr, setAddingAddr] = useState(false)
  const [addrSaving, setAddrSaving] = useState(false)
  const [addrMsg, setAddrMsg] = useState('')
  const [newAddr, setNewAddr] = useState({
    fullName: '', company: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: '',
  })

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    if (!token) return
    Promise.all([
      api.get<{ data: UserProfile }>('/api/account', token),
      api.get<{ data: OrderSummary[] }>('/api/orders', token),
      api.get<{ data: Address[] }>('/api/addresses', token),
    ]).then(([profileRes, ordersRes, addrRes]) => {
      setProfile(profileRes.data)
      setOrders(ordersRes.data.slice(0, 3))
      setAddresses(addrRes.data)
    }).finally(() => setLoading(false))
  }, [user, token, authLoading])

  function startEdit() {
    if (!profile) return
    setEditCompany(profile.companyName)
    setEditContact(profile.contactName)
    setEditPhone(profile.phone ?? '')
    setEditing(true)
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    try {
      const res = await api.patch<{ data: UserProfile }>('/api/account', token, {
        companyName: editCompany,
        contactName: editContact,
        phone: editPhone || undefined,
      })
      setProfile(res.data)
      setEditing(false)
      setSavedMsg(t.account.saved)
      setTimeout(() => setSavedMsg(''), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function saveAddress(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setAddrSaving(true)
    setAddrMsg('')
    try {
      const res = await api.post<{ data: Address }>('/api/addresses', token, {
        ...newAddr,
        company: newAddr.company || undefined,
        line2: newAddr.line2 || undefined,
        state: newAddr.state || undefined,
      })
      setAddresses(prev => [...prev, res.data])
      setAddingAddr(false)
      setNewAddr({ fullName: '', company: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: '' })
    } catch (err: unknown) {
      setAddrMsg(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setAddrSaving(false)
    }
  }

  async function deleteAddress(id: string) {
    if (!token) return
    await api.del(`/api/addresses/${id}`, token)
    setAddresses(prev => prev.filter(a => a.id !== id))
  }

  async function setDefaultAddress(id: string) {
    if (!token) return
    await api.patch(`/api/addresses/${id}`, token, {})
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })))
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>
  }

  if (!profile) return null

  const initials = (profile.contactName || profile.email).slice(0, 2).toUpperCase()

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-5 mb-8">
        <div className="w-16 h-16 rounded-full bg-gray-900 text-white text-xl font-black flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{profile.companyName}</h1>
          <p className="text-sm text-gray-400">{profile.email}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">{t.account.profile}</h2>
            {!editing && (
              <button onClick={startEdit} className="text-xs text-blue-600 hover:underline font-medium">
                {t.account.editProfile}
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={saveProfile} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">{t.account.companyName}</label>
                <input
                  required value={editCompany} onChange={e => setEditCompany(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">{t.account.contactName}</label>
                <input
                  required value={editContact} onChange={e => setEditContact(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">{t.account.phone}</label>
                <input
                  value={editPhone} onChange={e => setEditPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditing(false)} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  {t.account.cancel}
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors">
                  {saving ? '…' : t.account.saveChanges}
                </button>
              </div>
            </form>
          ) : (
            <dl className="space-y-3.5">
              {[
                [t.account.companyName, profile.companyName],
                [t.account.contactName, profile.contactName],
                [t.account.email, profile.email],
                [t.account.country, profile.country],
                [t.account.phone, profile.phone ?? '—'],
                [t.account.memberSince, formatDate(profile.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-baseline gap-4">
                  <dt className="text-xs text-gray-400 shrink-0">{label}</dt>
                  <dd className="text-sm font-medium text-gray-900 text-right truncate">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          {savedMsg && (
            <p className="text-center text-sm text-green-600 font-medium mt-3">{savedMsg}</p>
          )}
        </div>

        {/* Language & settings card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-5 uppercase tracking-widest">{t.account.language}</h2>
          <div className="space-y-2">
            {(Object.entries(LANG_LABELS) as [Lang, string][]).map(([code, label]) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-colors ${
                  lang === code
                    ? 'border-gray-900 bg-gray-900 text-white font-semibold'
                    : 'border-stone-200 text-gray-700 hover:border-gray-400 hover:bg-stone-50'
                }`}
              >
                <span>{label}</span>
                {lang === code && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Shipping addresses */}
      <div className="mt-5 bg-white rounded-2xl border border-stone-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Shipping Addresses</h2>
          {!addingAddr && (
            <button onClick={() => setAddingAddr(true)} className="text-xs text-blue-600 hover:underline font-medium">
              + Add Address
            </button>
          )}
        </div>

        {addresses.length === 0 && !addingAddr && (
          <p className="text-sm text-gray-400">No shipping addresses saved yet.</p>
        )}

        <div className="space-y-3">
          {addresses.map(addr => (
            <div key={addr.id} className={`rounded-xl border p-4 text-sm ${addr.isDefault ? 'border-gray-900 bg-gray-50' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{addr.fullName}{addr.company ? ` · ${addr.company}` : ''}</p>
                  <p className="text-gray-500 mt-0.5">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                  <p className="text-gray-500">{addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postalCode}</p>
                  <p className="text-gray-500">{addr.country}</p>
                  {addr.isDefault && <span className="inline-block mt-1 text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full font-medium">Default</span>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {!addr.isDefault && (
                    <button onClick={() => setDefaultAddress(addr.id)} className="text-xs text-blue-600 hover:underline">Set default</button>
                  )}
                  <button onClick={() => deleteAddress(addr.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {addingAddr && (
          <form onSubmit={saveAddress} className="mt-4 space-y-3 border-t border-gray-100 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Full Name *</label>
                <input required value={newAddr.fullName} onChange={e => setNewAddr(p => ({ ...p, fullName: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="Recipient name" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Company</label>
                <input value={newAddr.company} onChange={e => setNewAddr(p => ({ ...p, company: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="Optional" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Address Line 1 *</label>
              <input required value={newAddr.line1} onChange={e => setNewAddr(p => ({ ...p, line1: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="Street address" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Address Line 2</label>
              <input value={newAddr.line2} onChange={e => setNewAddr(p => ({ ...p, line2: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="Apt, floor, suite (optional)" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">City *</label>
                <input required value={newAddr.city} onChange={e => setNewAddr(p => ({ ...p, city: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">State / Province</label>
                <input value={newAddr.state} onChange={e => setNewAddr(p => ({ ...p, state: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Postal Code *</label>
                <input required value={newAddr.postalCode} onChange={e => setNewAddr(p => ({ ...p, postalCode: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Country *</label>
                <input required value={newAddr.country} onChange={e => setNewAddr(p => ({ ...p, country: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="e.g. United Arab Emirates" />
              </div>
            </div>
            {addrMsg && <p className="text-xs text-red-500">{addrMsg}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => { setAddingAddr(false); setAddrMsg('') }} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" disabled={addrSaving} className="flex-1 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors">{addrSaving ? '…' : 'Save Address'}</button>
            </div>
          </form>
        )}
      </div>

      {/* Recent orders */}
      <div className="mt-6 bg-white rounded-2xl border border-stone-200">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">{t.account.recentOrders}</h2>
          <Link href="/orders" className="text-xs text-blue-600 hover:underline font-medium">
            {t.account.viewAllOrders}
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">{t.account.noOrders}</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {orders.map(order => (
              <Link key={order.id} href={`/orders/${order.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-stone-50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{order.orderNumber}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {order._count.items} {t.cart.items} · {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-bold text-gray-900">{formatUsd(order.totalUsd)}</p>
                  <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full mt-1 font-medium ${STATUS_COLOR[order.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {t.orders.status[order.status] ?? order.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
