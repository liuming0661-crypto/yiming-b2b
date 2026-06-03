'use client'
import { useState } from 'react'
import { useLang } from '@/contexts/language-context'

interface Props {
  productId?: string
  productName?: string
  defaultQty?: number
  onClose: () => void
}

export function InquiryModal({ productId, productName, defaultQty = 200, onClose }: Props) {
  const { t } = useLang()
  const [form, setForm] = useState({ name: '', email: '', country: '', quantity: defaultQty, message: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, productId, productName }),
      })
      if (!res.ok) throw new Error()
      setDone(true)
    } catch {
      setError(t.inquiry?.errorMsg ?? 'Something went wrong, please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {done ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {t.inquiry?.successTitle ?? 'Inquiry Sent!'}
            </h3>
            <p className="text-gray-500 text-sm">
              {t.inquiry?.successMsg ?? "We'll reply to your email within 24 hours."}
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              {t.inquiry?.close ?? 'Close'}
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {t.inquiry?.title ?? 'Request a Quote'}
            </h3>
            {productName && (
              <p className="text-sm text-gray-500 mb-5">{productName}</p>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t.inquiry?.name ?? 'Your Name'} *
                  </label>
                  <input
                    required
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t.inquiry?.country ?? 'Country'}
                  </label>
                  <input
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="e.g. UAE"
                    value={form.country}
                    onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t.inquiry?.email ?? 'Email Address'} *
                </label>
                <input
                  required
                  type="email"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t.inquiry?.quantity ?? 'Quantity (pcs)'}
                </label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t.inquiry?.message ?? 'Message (optional)'}
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                  placeholder={t.inquiry?.messagePlaceholder ?? 'Customization, packaging requirements…'}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                />
              </div>

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gray-900 text-white rounded-full font-semibold text-sm hover:bg-gray-700 transition-colors disabled:opacity-60"
              >
                {loading
                  ? (t.inquiry?.sending ?? 'Sending…')
                  : (t.inquiry?.submit ?? 'Send Inquiry')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
