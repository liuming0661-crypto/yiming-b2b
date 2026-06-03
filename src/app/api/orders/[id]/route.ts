import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function getOrderId(req: NextRequest): string {
  const segments = new URL(req.url).pathname.split('/')
  return segments[segments.length - 1]
}

// GET /api/orders/[id] — order detail
export const GET = withAuth(async (req: NextRequest, ctx) => {
  const orderId = getOrderId(req)

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      buyerId: ctx.userId, // buyers can only see their own orders
    },
    include: {
      items: {
        include: {
          product: {
            select: { nameEn: true, nameAr: true, nameZh: true, sku: true, images: true },
          },
        },
      },
      buyer: {
        select: { companyName: true, contactName: true, email: true, country: true, phone: true },
      },
      shippingAddr: true,
      payments: {
        orderBy: { createdAt: 'desc' },
      },
      shipment: true,
    },
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json({ data: order })
})
