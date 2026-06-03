import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@/lib/shared'

function getOrderId(req: NextRequest): string {
  const segments = new URL(req.url).pathname.split('/')
  return segments[segments.length - 2] // /api/admin/orders/[id]/status → id is at [-2]
}

const schema = z.object({
  status: z.nativeEnum(OrderStatus),
  trackingNumber: z.string().max(100).optional(),
  carrier: z.string().max(100).optional(),
})

export const PUT = withAdmin(async (req: NextRequest) => {
  const id = getOrderId(req)
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const order = await prisma.order.findUnique({ where: { id }, select: { id: true, status: true } })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const { status, trackingNumber, carrier } = parsed.data

  // If transitioning to SHIPPED, create or update shipment record
  if (status === OrderStatus.SHIPPED && (trackingNumber || carrier)) {
    await prisma.shipment.upsert({
      where: { orderId: id },
      create: { orderId: id, trackingNumber: trackingNumber ?? '', carrier: carrier ?? '', status: 'SHIPPED' },
      update: { trackingNumber: trackingNumber ?? undefined, carrier: carrier ?? undefined, status: 'SHIPPED' },
    })
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json({ data: updated })
})
