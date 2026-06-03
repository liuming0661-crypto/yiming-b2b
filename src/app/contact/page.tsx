import Link from 'next/link'

export default function ContactPage() {
  const channels = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Email',
      value: 'trade@yiming-export.com',
      href: 'mailto:trade@yiming-export.com',
      note: 'Response within 24 hours',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      label: 'WhatsApp',
      value: '+86 139 0000 0000',
      href: 'https://wa.me/8613900000000',
      note: 'Mon–Fri, 9:00–18:00 CST',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: 'Office Address',
      value: 'No. 1 Chouzhou North Road, Yiwu, Zhejiang 322000, China',
      href: null,
      note: 'Showroom visits by appointment',
    },
  ]

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-20">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Get in Touch</p>
          <h1 className="text-4xl font-black text-gray-900 mb-4">Contact Us</h1>
          <p className="text-gray-500 max-w-xl mx-auto leading-relaxed">
            Our trade team speaks English, Arabic and Chinese.
            Reach out for product enquiries, order support, or sourcing requests.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Contact channels */}
          <div className="space-y-5">
            {channels.map(ch => (
              <div key={ch.label} className="bg-stone-50 rounded-2xl p-6 flex gap-4">
                <div className="w-11 h-11 rounded-xl bg-gray-900 text-white flex items-center justify-center shrink-0">
                  {ch.icon}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{ch.label}</p>
                  {ch.href ? (
                    <a href={ch.href} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-sm">
                      {ch.value}
                    </a>
                  ) : (
                    <p className="font-semibold text-gray-900 text-sm">{ch.value}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{ch.note}</p>
                </div>
              </div>
            ))}

            {/* Business hours */}
            <div className="bg-stone-50 rounded-2xl p-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Business Hours</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Monday – Friday</span>
                  <span className="font-medium text-gray-900">09:00 – 18:00 CST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Saturday</span>
                  <span className="font-medium text-gray-900">09:00 – 13:00 CST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sunday & Public Holidays</span>
                  <span className="font-medium text-gray-900">Closed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick links / FAQ */}
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-5">Quick Help</h2>
            <div className="space-y-3">
              {[
                { q: 'How do I place an order?', a: 'Register for a buyer account, add products to your cart, and place the order. Our team will confirm and send banking details.', href: '/register' },
                { q: 'What is the minimum order?', a: 'Our minimum order value is USD 500 per order. Individual products have their own MOQ (minimum order quantity).', href: null },
                { q: 'How do I pay?', a: 'We accept T/T wire transfers. After placing your order, upload your bank receipt and our team verifies payment within 24 hours.', href: null },
                { q: 'How long does shipping take?', a: 'Typically 15–30 days depending on destination and shipping method. Tracking number is provided after shipment.', href: null },
              ].map(item => (
                <div key={item.q} className="border border-stone-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-1">{item.q}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
                  {item.href && (
                    <Link href={item.href} className="text-xs text-blue-600 hover:underline mt-2 inline-block font-medium">
                      Get started →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
