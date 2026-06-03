'use client'
import { useState } from 'react'
import { useLang } from '@/contexts/language-context'

const steps = [
  { icon: '🛒', en: 'Add to cart & confirm order', zh: '加入购物车确认订单', tw: '加入購物車確認訂單' },
  { icon: '🏦', en: 'Receive our bank details by email', zh: '收到我们的银行汇款信息', tw: '收到我們的銀行匯款資訊' },
  { icon: '💸', en: 'Wire T/T payment from your bank', zh: '通过银行电汇 T/T 付款', tw: '透過銀行電匯 T/T 付款' },
  { icon: '📤', en: 'Upload payment receipt in your order', zh: '在订单页上传付款凭证', tw: '在訂單頁上傳付款憑證' },
  { icon: '✅', en: 'We verify & start preparing your goods', zh: '我们确认后备货发货', tw: '我們確認後備貨出貨' },
]

export function PaymentGuide() {
  const [open, setOpen] = useState(false)
  const { lang } = useLang()

  const label = lang === 'zh-CN' ? '如何付款？' : lang === 'zh-TW' ? '如何付款？' : 'How to Pay?'
  const title = lang === 'zh-CN' ? 'T/T 电汇付款流程' : lang === 'zh-TW' ? 'T/T 電匯付款流程' : 'T/T Wire Transfer Process'
  const note = lang === 'zh-CN'
    ? '• 接受 USD / EUR / GBP · 最低订单金额 $500 · 付款后 24 小时内确认'
    : lang === 'zh-TW'
    ? '• 接受 USD / EUR / GBP · 最低訂單金額 $500 · 付款後 24 小時內確認'
    : '• Accepts USD / EUR / GBP · Min. order $500 · Confirmed within 24 h of payment'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors underline underline-offset-2"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-7 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-5">{title}</h3>

            <ol className="space-y-3">
              {steps.map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-xl shrink-0 mt-0.5">{s.icon}</span>
                  <div>
                    <span className="text-xs font-bold text-gray-400 mr-2">0{i + 1}</span>
                    <span className="text-sm text-gray-700">
                      {lang === 'zh-CN' ? s.zh : lang === 'zh-TW' ? s.tw : s.en}
                    </span>
                  </div>
                </li>
              ))}
            </ol>

            <p className="mt-5 text-xs text-gray-400 leading-relaxed border-t border-gray-100 pt-4">{note}</p>
          </div>
        </div>
      )}
    </>
  )
}
