'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLang } from '@/contexts/language-context'
import { api } from '@/lib/api'

export default function RegisterPage() {
  const { register } = useAuth()
  const { t } = useLang()
  const router = useRouter()
  const [step, setStep] = useState<'account' | 'company'>('account')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [country, setCountry] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAccount(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError(t.register.passwordMin); return }
    setStep('company')
  }

  async function handleCompany(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await register(email, password)
      const token = await user.getIdToken()
      await api.post('/api/auth/register', token, {
        companyName, contactName, country: country.toUpperCase().slice(0, 2), phone,
      })
      router.push('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-gray-50 focus:bg-white transition-colors"

  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden lg:flex flex-1 bg-stone-100 items-center justify-center p-16">
        <div className="text-center max-w-xs">
          <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-2xl font-black">YM</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{t.register.brandTitle}</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">{t.register.brandSub}</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {([
              [t.register.stat1Val, t.register.stat1Label],
              [t.register.stat2Val, t.register.stat2Label],
              [t.register.stat3Val, t.register.stat3Label],
            ] as [string, string][]).map(([val, label]) => (
              <div key={label} className="bg-white rounded-2xl p-3">
                <p className="text-sm font-bold text-gray-900">{val}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="text-2xl font-black text-gray-900 tracking-tight block mb-10">YIMING</Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 'account' ? t.register.title : t.register.step2Title}
          </h1>
          <p className="text-gray-500 mb-6 text-sm">
            {t.register.alreadyRegistered}{' '}
            <Link href="/login" className="text-gray-900 font-semibold underline hover:no-underline">{t.register.signin}</Link>
          </p>
          <div className="flex gap-2 mb-8">
            <div className="flex-1 h-1 rounded-full bg-gray-900" />
            <div className={`flex-1 h-1 rounded-full ${step === 'company' ? 'bg-gray-900' : 'bg-gray-200'}`} />
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

          {step === 'account' ? (
            <form onSubmit={handleAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.register.email}</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder={t.register.emailPlaceholder} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.register.password}</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className={inputClass} placeholder={t.register.passwordPlaceholder} />
              </div>
              <button type="submit" className="w-full py-3.5 rounded-full bg-gray-900 text-white text-sm font-bold hover:bg-gray-700 transition-colors mt-2">
                {t.register.continue}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCompany} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.register.companyName}</label>
                <input required value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputClass} placeholder={t.register.companyPlaceholder} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.register.contactName}</label>
                <input required value={contactName} onChange={e => setContactName(e.target.value)} className={inputClass} placeholder={t.register.contactPlaceholder} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.register.country}</label>
                <input required maxLength={2} value={country} onChange={e => setCountry(e.target.value)} className={inputClass} placeholder={t.register.countryPlaceholder} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t.register.phone} <span className="font-normal text-gray-400">{t.register.phoneOptional}</span>
                </label>
                <input value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} placeholder={t.register.phonePlaceholder} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep('account')} className="flex-1 py-3.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  {t.register.back}
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-3.5 rounded-full bg-gray-900 text-white text-sm font-bold hover:bg-gray-700 disabled:opacity-50 transition-colors">
                  {loading ? t.register.creating : t.register.createAccount}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
