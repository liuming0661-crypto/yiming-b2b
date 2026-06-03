import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

function getBuyerId(req: NextRequest): string {
  const segments = new URL(req.url).pathname.split('/')
  return segments[segments.length - 1]
}

const select = {
  id: true,
  email: true,
  companyName: true,
  contactName: true,
  country: true,
  phone: true,
  status: true,
  createdAt: true,
  orders: {
    orderBy: { createdAt: 'desc' as const },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      totalUsd: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  },
}

export const GET = withAdmin(async (req: NextRequest) => {
  const id = getBuyerId(req)
  const buyer = await prisma.user.findUnique({ where: { id }, select })
  if (!buyer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: buyer })
})

const patchSchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED']),
})

export const PATCH = withAdmin(async (req: NextRequest) => {
  const id = getBuyerId(req)
  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  const buyer = await prisma.user.update({
    where: { id },
    data: { status: parsed.data.status },
    select,
  })
  return NextResponse.json({ data: buyer })
})
