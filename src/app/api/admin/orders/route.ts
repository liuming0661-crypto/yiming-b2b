import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OrderStatus, PaymentStatus } from '@/lib/shared'
import type { Prisma } from '@prisma/client'

// GET /api/admin/orders — all orders with filters and search
export const GET = withAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') ?? 20)))
  const status = searchParams.get('status') ?? undefined
  const paymentStatus = searchParams.get('paymentStatus') ?? undefined
  const q = searchParams.get('q')?.trim() ?? ''
  const skip = (page - 1) * pageSize

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status: status as OrderStatus } : {}),
    ...(paymentStatus ? { paymentStatus: paymentStatus as PaymentStatus } : {}),
    ...(q ? {
      OR: [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { buyer: { companyName: { contains: q, mode: 'insensitive' } } },
        { buyer: { email: { contains: q, mode: 'insensitive' } } },
      ],
    } : {}),
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { companyName: true, country: true, email: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ])

  return NextResponse.json({ data: orders, total, page, pageSize })
})
