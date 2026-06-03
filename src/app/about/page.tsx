import Link from 'next/link'

export default function AboutPage() {
  const pillars = [
    { icon: '🏭', title: 'Factory-Direct Sourcing', body: 'We work directly with Yiwu manufacturers, cutting out intermediaries to give you the best wholesale prices on 10,000+ products.' },
    { icon: '🌍', title: 'Global Export Experience', body: 'Serving buyers across the Middle East, Southeast Asia, Africa and Europe. We handle customs documentation, SWIFT payments and multi-carrier logistics.' },
    { icon: '🔒', title: 'Verified & Trusted', body: 'Every supplier is vetted. Products are quality-inspected before shipment. Your orders are protected by our payment verification process.' },
    { icon: '💬', title: 'Dedicated Support', body: 'English, Arabic and Chinese-speaking trade managers available to assist with product sourcing, negotiation and after-sales queries.' },
  ]

  const stats = [
    { value: '10,000+', label: 'Products Listed' },
    { value: '50+', label: 'Countries Served' },
    { value: '5+', label: 'Years in Export' },
    { value: '1,000+', label: 'Satisfied Buyers' },
  ]

  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">About YIMING</p>
        <h1 className="text-4xl font-black text-gray-900 leading-tight mb-5">
          Your Direct Line to<br />Yiwu Wholesale
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
          YIMING is a B2B wholesale export platform connecting international buyers directly with verified
          manufacturers in Yiwu, China — the world's largest small commodities market.
        </p>
      </div>

      {/* Stats bar */}
      <div className="border-y border-stone-100 bg-stone-50">
        <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <p className="text-3xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pillars */}
      <div className="max-w-4xl mx-auto px-6 py-14">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-10">Why Buyers Choose YIMING</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {pillars.map(p => (
            <div key={p.title} className="bg-stone-50 rounded-2xl p-6">
              <p className="text-3xl mb-3">{p.icon}</p>
              <h3 className="font-bold text-gray-900 mb-2">{p.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-14">
          <h2 className="text-xl font-bold mb-10 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            {[
              { step: '01', title: 'Register', body: 'Create your buyer account — free, instant approval.' },
              { step: '02', title: 'Browse & Order', body: 'Add products to cart with volume pricing applied automatically.' },
              { step: '03', title: 'Wire Payment', body: 'Pay via T/T bank transfer and upload your receipt.' },
              { step: '04', title: 'We Ship', body: 'Goods packed, customs cleared, and shipped with tracking.' },
            ].map(s => (
              <div key={s.step}>
                <p className="text-4xl font-black text-gray-600 mb-2">{s.step}</p>
                <p className="font-semibold mb-1">{s.title}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-6 py-14 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to start sourcing?</h2>
        <p className="text-gray-500 mb-7">Register for a free buyer account and browse our full catalog.</p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register" className="px-7 py-3 rounded-full bg-gray-900 text-white font-bold text-sm hover:bg-gray-700 transition-colors">
            Create Account
          </Link>
          <Link href="/contact" className="px-7 py-3 rounded-full border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}
