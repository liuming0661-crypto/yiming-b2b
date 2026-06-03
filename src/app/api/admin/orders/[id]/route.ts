import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function getOrderId(req: NextRequest): string {
  const segments = new URL(req.url).pathname.split('/')
  return segments[segments.length - 1]
}

export const GET = withAdmin(async (req: NextRequest) => {
  const id = getOrderId(req)

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      buyer: {
        select: { companyName: true, contactName: true, country: true, email: true, phone: true },
      },
      items: {
        include: {
          product: { select: { nameEn: true, nameAr: true, sku: true, images: true } },
        },
      },
      payments: { orderBy: { createdAt: 'desc' } },
      shippingAddr: true,
      shipment: true,
    },
  })

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  return NextResponse.json({ data: order })
})
