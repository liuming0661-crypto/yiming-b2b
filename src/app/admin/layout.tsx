'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/lib/api'

interface Me { isAdmin: boolean; email: string }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, token, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user || !token) { router.replace('/login'); return }

    api.get<{ data: Me }>('/api/auth/me', token)
      .then(res => {
        if (!res.data.isAdmin) { router.replace('/'); return }
        setIsAdmin(true)
      })
      .catch(() => router.replace('/'))
      .finally(() => setChecking(false))
  }, [user, token, authLoading])

  if (authLoading || checking) {
    return <div className="flex items-center justify-center h-screen text-gray-400">Loading…</div>
  }

  if (!isAdmin) return null

  const navItems = [
    { href: '/admin', label: 'Dashboard', exact: true },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/products', label: 'Products' },
    { href: '/admin/categories', label: 'Categories' },
    { href: '/admin/buyers', label: 'Buyers' },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-48 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Admin</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">YiMing B2B</p>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map(item => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="px-4 py-3 border-t border-gray-100">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            ← Storefront
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
