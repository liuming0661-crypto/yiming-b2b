import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OrderStatus, PaymentStatus } from '@/lib/shared'

export const GET = withAdmin(async () => {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const [
    totalOrders,
    pendingVerification,
    activeOrders,
    totalRevenue,
    totalProducts,
    totalBuyers,
    recentOrders,
    monthlyRaw,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { paymentStatus: PaymentStatus.PENDING_VERIFICATION } }),
    prisma.order.count({ where: { status: { in: [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.SHIPPED] } } }),
    prisma.order.aggregate({ where: { paymentStatus: PaymentStatus.PAID }, _sum: { totalUsd: true } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count(),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, orderNumber: true, totalUsd: true, status: true, paymentStatus: true, createdAt: true,
        buyer: { select: { companyName: true, country: true } },
      },
    }),
    prisma.$queryRaw<{ month: Date; revenue: number; orders: number }[]>`
      SELECT
        DATE_TRUNC('month', "createdAt") AS month,
        SUM("totalUsd")::float AS revenue,
        COUNT(*)::int AS orders
      FROM "Order"
      WHERE "paymentStatus" = 'PAID'
        AND "createdAt" >= ${sixMonthsAgo}
      GROUP BY month
      ORDER BY month ASC
    `,
  ])

  // Fill in missing months with zeros
  const monthlyRevenue: { month: string; revenue: number; orders: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const found = monthlyRaw.find(r => {
      const rd = new Date(r.month)
      return `${rd.getFullYear()}-${String(rd.getMonth() + 1).padStart(2, '0')}` === key
    })
    monthlyRevenue.push({ month: key, revenue: found?.revenue ?? 0, orders: found?.orders ?? 0 })
  }

  return NextResponse.json({
    data: {
      totalOrders,
      pendingVerification,
      activeOrders,
      totalRevenue: totalRevenue._sum.totalUsd ?? 0,
      totalProducts,
      totalBuyers,
      recentOrders,
      monthlyRevenue,
    },
  })
})
