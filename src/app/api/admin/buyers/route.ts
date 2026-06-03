import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export const GET = withAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') ?? 20)))
  const q = searchParams.get('q')?.trim() ?? ''
  const skip = (page - 1) * pageSize

  const where: Prisma.UserWhereInput = q ? {
    OR: [
      { email: { contains: q, mode: 'insensitive' } },
      { companyName: { contains: q, mode: 'insensitive' } },
      { country: { contains: q, mode: 'insensitive' } },
    ],
  } : {}

  const [buyers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        companyName: true,
        contactName: true,
        country: true,
        phone: true,
        status: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({ data: buyers, total, page, pageSize })
})
