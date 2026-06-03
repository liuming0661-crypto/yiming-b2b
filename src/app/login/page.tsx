'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLang } from '@/contexts/language-context'

export default function LoginPage() {
  const { login } = useAuth()
  const { t } = useLang()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.push('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="text-2xl font-black text-gray-900 tracking-tight block mb-10">YIMING</Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.login.welcome}</h1>
          <p className="text-gray-500 mb-8 text-sm">
            {t.login.newBuyer}{' '}
            <Link href="/register" className="text-gray-900 font-semibold underline hover:no-underline">{t.login.createAccount}</Link>
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.login.email}</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-gray-50 focus:bg-white transition-colors"
                placeholder={t.login.emailPlaceholder} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.login.password}</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-gray-50 focus:bg-white transition-colors"
                placeholder={t.login.passwordPlaceholder} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-full bg-gray-900 text-white text-sm font-bold hover:bg-gray-700 disabled:opacity-50 transition-colors mt-2">
              {loading ? t.login.signingIn : t.login.signin}
            </button>
          </form>
        </div>
      </div>
      <div className="hidden lg:flex flex-1 bg-stone-100 items-center justify-center p-16">
        <div className="text-center max-w-xs">
          <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-2xl font-black">YM</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{t.login.brandTitle}</h2>
          <p className="text-gray-500 text-sm leading-relaxed">{t.login.brandSub}</p>
        </div>
      </div>
    </div>
  )
}
