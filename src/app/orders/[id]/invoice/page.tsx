'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/lib/api'
import { formatUsd } from '@/lib/shared'

interface OrderItem {
  id: string
  quantity: number
  unitPriceUsd: number
  subtotalUsd: number
  product: { nameEn: string; sku: string }
}

interface ShippingAddr {
  fullName: string
  company: string | null
  line1: string
  line2: string | null
  city: string
  state: string | null
  postalCode: string
  country: string
}

interface Buyer {
  companyName: string
  contactName: string
  email: string
  country: string
  phone: string | null
}

interface Order {
  id: string
  orderNumber: string
  totalUsd: number
  createdAt: string
  items: OrderItem[]
  buyer: Buyer
  shippingAddr: ShippingAddr | null
}

const SELLER = {
  name: 'YiMing Export Co., Ltd.',
  address: 'No. 1 Chouzhou North Road, Yiwu',
  city: 'Yiwu, Zhejiang 322000',
  country: 'China',
  email: 'trade@yiming-export.com',
}

const BANK = {
  name: 'Bank of China',
  branch: 'Yiwu International Branch',
  account: '6217 0000 0000 0000',
  swift: 'BKCHCNBJ',
  beneficiary: 'YiMing Export Co., Ltd.',
}

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>()
  const { user, token, loading: authLoading } = useAuth()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    if (!token) return
    api.get<{ data: Order }>(`/api/orders/${id}`, token)
      .then(res => setOrder(res.data))
      .finally(() => setLoading(false))
  }, [user, token, id, authLoading])

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 print:hidden">Loading…</div>
  if (!order) return <div className="text-center py-16 text-gray-500 print:hidden">Order not found</div>

  const piNumber = `PI-${order.orderNumber}`
  const issueDate = new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const shipTo = order.shippingAddr

  return (
    <>
      {/* Print button — hidden when printing */}
      <div className="print:hidden flex items-center gap-3 px-8 py-4 border-b border-gray-100 bg-white">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          ← Back
        </button>
        <span className="text-gray-200">|</span>
        <button
          onClick={() => window.print()}
          className="px-5 py-2 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
        >
          Print / Save as PDF
        </button>
        <span className="text-xs text-gray-400">Use browser's "Save as PDF" option when printing</span>
      </div>

      {/* Invoice document */}
      <div className="max-w-3xl mx-auto px-8 py-10 print:px-0 print:py-0 print:max-w-none">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">PROFORMA INVOICE</h1>
            <p className="text-sm text-gray-400 mt-1">{piNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">{SELLER.name}</p>
            <p className="text-sm text-gray-500">{SELLER.address}</p>
            <p className="text-sm text-gray-500">{SELLER.city}</p>
            <p className="text-sm text-gray-500">{SELLER.country}</p>
            <p className="text-sm text-gray-500">{SELLER.email}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-8 mb-8 border-y border-gray-200 py-5">
          <div className="space-y-1.5 text-sm">
            <div className="flex gap-3">
              <span className="text-gray-400 w-28 shrink-0">Invoice No.</span>
              <span className="font-semibold text-gray-900">{piNumber}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-400 w-28 shrink-0">Order Ref.</span>
              <span className="font-medium text-gray-700">{order.orderNumber}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-400 w-28 shrink-0">Issue Date</span>
              <span className="font-medium text-gray-700">{issueDate}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-400 w-28 shrink-0">Payment Terms</span>
              <span className="font-medium text-gray-700">T/T Wire Transfer</span>
            </div>
          </div>

          {/* Bill To */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Bill To</p>
            <p className="font-bold text-gray-900">{order.buyer.companyName}</p>
            <p className="text-sm text-gray-600">{order.buyer.contactName}</p>
            <p className="text-sm text-gray-500">{order.buyer.email}</p>
            {order.buyer.phone && <p className="text-sm text-gray-500">{order.buyer.phone}</p>}
            <p className="text-sm text-gray-500">{order.buyer.country}</p>
          </div>
        </div>

        {/* Ship To */}
        {shipTo && (
          <div className="mb-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Ship To</p>
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700">
              <p className="font-semibold">{shipTo.fullName}{shipTo.company ? ` · ${shipTo.company}` : ''}</p>
              <p>{shipTo.line1}{shipTo.line2 ? `, ${shipTo.line2}` : ''}</p>
              <p>{shipTo.city}{shipTo.state ? `, ${shipTo.state}` : ''} {shipTo.postalCode}</p>
              <p>{shipTo.country}</p>
            </div>
          </div>
        )}

        {/* Items table */}
        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="border-b-2 border-gray-900">
              <th className="text-left pb-2 text-xs font-bold text-gray-900 uppercase tracking-wide">Description</th>
              <th className="text-left pb-2 text-xs font-bold text-gray-900 uppercase tracking-wide">SKU</th>
              <th className="text-right pb-2 text-xs font-bold text-gray-900 uppercase tracking-wide">Qty</th>
              <th className="text-right pb-2 text-xs font-bold text-gray-900 uppercase tracking-wide">Unit Price</th>
              <th className="text-right pb-2 text-xs font-bold text-gray-900 uppercase tracking-wide">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.items.map(item => (
              <tr key={item.id}>
                <td className="py-3 text-gray-800 font-medium">{item.product.nameEn}</td>
                <td className="py-3 text-gray-400 font-mono text-xs">{item.product.sku}</td>
                <td className="py-3 text-right text-gray-700">{item.quantity.toLocaleString()}</td>
                <td className="py-3 text-right text-gray-700">{formatUsd(item.unitPriceUsd)}</td>
                <td className="py-3 text-right font-semibold text-gray-900">{formatUsd(item.subtotalUsd)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-900">
              <td colSpan={3} />
              <td className="pt-3 text-right text-sm font-bold text-gray-900">Total (USD)</td>
              <td className="pt-3 text-right text-lg font-black text-gray-900">{formatUsd(order.totalUsd)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Bank details */}
        <div className="border border-gray-200 rounded-xl p-5 mb-8">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Banking Details (T/T Wire Transfer)</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
            {[
              ['Beneficiary Bank', `${BANK.name} · ${BANK.branch}`],
              ['Account Number', BANK.account],
              ['SWIFT / BIC', BANK.swift],
              ['Beneficiary Name', BANK.beneficiary],
              ['Payment Reference', order.orderNumber],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <span className="text-gray-400 w-40 shrink-0">{label}</span>
                <span className="font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer notes */}
        <div className="text-xs text-gray-400 space-y-1 border-t border-gray-100 pt-5">
          <p>This is a proforma invoice. Goods will be prepared upon receipt of full payment.</p>
          <p>All prices are in USD. Bank charges are to be borne by the remitter.</p>
          <p>This document is valid for 30 days from the issue date.</p>
        </div>

      </div>

      <style>{`
        @media print {
          @page { margin: 15mm; size: A4; }
          body { font-size: 12px; }
        }
      `}</style>
    </>
  )
}
