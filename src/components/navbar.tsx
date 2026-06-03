'use client'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLang } from '@/contexts/language-context'
import { LANG_LABELS, type Lang } from '@/lib/i18n'
import { useCart } from '@/contexts/cart-context'
import { useState, useEffect, useRef, Suspense } from 'react'

function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { t } = useLang()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setQ(searchParams.get('q') ?? '')
  }, [searchParams])

  function handleChange(value: string) {
    setQ(value)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (value.trim()) params.set('q', value.trim())
      const target = pathname === '/' ? `/?${params}` : `/?${params}`
      router.push(target, { scroll: false })
    }, 300)
  }

  return (
    <div className="relative w-full max-w-xl">
      <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        value={q}
        onChange={e => handleChange(e.target.value)}
        placeholder={t.nav.searchPlaceholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-300 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-colors"
      />
      {q && (
        <button
          onClick={() => handleChange('')}
          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

export function Navbar() {
  const { user, logout } = useAuth()
  const { lang, setLang, t } = useLang()
  const { count: cartCount } = useCart()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)

  async function handleLogout() {
    setLoggingOut(true)
    setMenuOpen(false)
    await logout()
    router.push('/login')
    setLoggingOut(false)
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const langShort: Record<Lang, string> = { 'en': 'EN', 'zh-CN': '简', 'zh-TW': '繁' }

  return (
    <header className="sticky top-0 z-40 bg-stone-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="shrink-0 font-black text-xl tracking-tight text-gray-900 mr-2">
          YIMING
        </Link>

        {/* Centered search */}
        <div className="flex-1 flex justify-center">
          <Suspense fallback={<div className="w-full max-w-xl h-10 bg-gray-100 rounded-full animate-pulse" />}>
            <SearchBar />
          </Suspense>
        </div>

        {/* Right actions */}
        <div className="shrink-0 flex items-center gap-1 ml-2">
          {/* Language switcher */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(o => !o)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              {langShort[lang]}
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 text-sm z-50">
                {(Object.entries(LANG_LABELS) as [Lang, string][]).map(([code, label]) => (
                  <button
                    key={code}
                    onClick={() => { setLang(code); setLangOpen(false) }}
                    className={`w-full text-left px-4 py-2 transition-colors ${
                      lang === code ? 'bg-gray-50 text-gray-900 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <>
              <Link href="/cart" className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors" title={t.nav.cart}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-gray-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
              <Link href="/orders" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors">
                {t.nav.orders}
              </Link>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="w-8 h-8 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  {(user.email?.[0] ?? '?').toUpperCase()}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 text-sm">
                    <div className="px-4 py-2 text-xs text-gray-400 truncate border-b border-gray-100">{user.email}</div>
                    <Link
                      href="/account"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {t.nav.account}
                    </Link>
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {loggingOut ? '…' : t.nav.logout}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors">
                {t.nav.login}
              </Link>
              <Link href="/register" className="text-sm font-semibold px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition-colors">
                {t.nav.signup}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
