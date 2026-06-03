import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadFile, getExtFromMime } from '@/lib/storage'
import { PaymentMethod, PaymentStatus, OrderStatus } from '@/lib/shared'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

function getOrderId(req: NextRequest): string {
  const segments = new URL(req.url).pathname.split('/')
  // path: /api/orders/[id]/payment/tt → id is at index -3
  return segments[segments.length - 3]
}

// POST /api/orders/[id]/payment/tt — upload TT wire receipt
export const POST = withAuth(async (req: NextRequest, ctx) => {
  const orderId = getOrderId(req)

  const order = await prisma.order.findFirst({
    where: { id: orderId, buyerId: ctx.userId },
    select: { id: true, status: true, paymentMethod: true, paymentStatus: true, totalUsd: true },
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  if (order.paymentMethod !== PaymentMethod.TT_WIRE) {
    return NextResponse.json({ error: 'Order payment method is not TT wire' }, { status: 400 })
  }
  if (order.paymentStatus === PaymentStatus.PAID) {
    return NextResponse.json({ error: 'Order is already paid' }, { status: 400 })
  }
  if (order.status === OrderStatus.CANCELLED) {
    return NextResponse.json({ error: 'Order is cancelled' }, { status: 400 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('receipt')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Missing receipt file (field name: receipt)' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `File type not allowed. Accepted: ${ALLOWED_TYPES.join(', ')}` },
      { status: 400 },
    )
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })
  }

  const ext = getExtFromMime(file.type)
  const path = `receipts/${orderId}/${Date.now()}.${ext}`
  const buffer = await file.arrayBuffer()

  let receiptUrl: string
  try {
    receiptUrl = await uploadFile(path, buffer, file.type)
  } catch (err) {
    console.error('Storage upload error:', err)
    return NextResponse.json({ error: 'Failed to upload receipt' }, { status: 500 })
  }

  // Create payment record and update order in a transaction
  const [payment] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        orderId,
        method: PaymentMethod.TT_WIRE,
        amountUsd: order.totalUsd,
        status: PaymentStatus.PENDING_VERIFICATION,
        receiptUrl,
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: PaymentStatus.PENDING_VERIFICATION },
    }),
  ])

  return NextResponse.json({ data: payment }, { status: 201 })
})
