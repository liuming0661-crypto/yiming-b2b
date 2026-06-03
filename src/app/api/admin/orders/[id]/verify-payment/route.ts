import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PaymentStatus, OrderStatus } from '@/lib/shared'

function getOrderId(req: NextRequest): string {
  const segments = new URL(req.url).pathname.split('/')
  return segments[segments.length - 2] // /api/admin/orders/[id]/verify-payment → id is at [-2]
}

const verifySchema = z.object({
  approved: z.boolean(),
  note: z.string().max(500).optional(),
})

// POST /api/admin/orders/[id]/verify-payment
export const POST = withAdmin(async (req: NextRequest, ctx) => {
  const orderId = getOrderId(req)
  const body = await req.json()
  const parsed = verifySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, paymentStatus: true, status: true },
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  if (order.paymentStatus !== PaymentStatus.PENDING_VERIFICATION) {
    return NextResponse.json(
      { error: 'Order is not pending payment verification' },
      { status: 400 },
    )
  }

  const now = new Date()
  const newPaymentStatus = parsed.data.approved ? PaymentStatus.PAID : PaymentStatus.UNPAID
  const newOrderStatus = parsed.data.approved ? OrderStatus.PAID : OrderStatus.PENDING_PAYMENT

  await prisma.$transaction([
    // Update the latest pending payment record
    prisma.payment.updateMany({
      where: { orderId, status: PaymentStatus.PENDING_VERIFICATION },
      data: {
        status: newPaymentStatus,
        verifiedAt: now,
        verifiedBy: ctx.userId,
      },
    }),
    // Update order status
    prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: newPaymentStatus,
        status: newOrderStatus,
        ...(parsed.data.note ? { notes: parsed.data.note } : {}),
      },
    }),
  ])

  const updated = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payments: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  return NextResponse.json({ data: updated })
})
