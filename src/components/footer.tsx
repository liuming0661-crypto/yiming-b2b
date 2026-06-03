'use client'
import Link from 'next/link'
import { useLang } from '@/contexts/language-context'

export function Footer() {
  const { t } = useLang()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-stone-100 border-t border-stone-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <p className="font-black text-gray-900 text-xl tracking-tight mb-3">YIMING</p>
          <p className="text-sm text-gray-500 leading-relaxed">{t.footer.tagline}</p>
        </div>

        {/* Explore */}
        <div>
          <p className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">{t.footer.explore}</p>
          <ul className="space-y-2.5 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-gray-900 transition-colors">{t.footer.allProducts}</Link></li>
            <li><Link href="/register" className="hover:text-gray-900 transition-colors">{t.footer.signUpToBuy}</Link></li>
          </ul>
        </div>

        {/* Account */}
        <div>
          <p className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">{t.footer.account}</p>
          <ul className="space-y-2.5 text-sm text-gray-500">
            <li><Link href="/orders" className="hover:text-gray-900 transition-colors">{t.footer.myOrders}</Link></li>
            <li><Link href="/cart" className="hover:text-gray-900 transition-colors">{t.footer.myCart}</Link></li>
            <li><Link href="/account" className="hover:text-gray-900 transition-colors">{t.footer.myAccount}</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <p className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">{t.footer.company}</p>
          <ul className="space-y-2.5 text-sm text-gray-500">
            <li><Link href="/about" className="hover:text-gray-900 transition-colors">{t.footer.aboutUs}</Link></li>
            <li><Link href="/contact" className="hover:text-gray-900 transition-colors">{t.footer.contact}</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-stone-200 py-5 px-6 flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {t.footer.copyright.replace('{year}', String(year))}
        </p>
        <div className="flex items-center gap-4">
          {/* WeChat / WhatsApp / Email icons placeholder */}
          <a href="mailto:info@yimingb2b.com" className="text-gray-400 hover:text-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  )
}
