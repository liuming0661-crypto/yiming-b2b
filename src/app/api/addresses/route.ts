import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const createSchema = z.object({
  fullName: z.string().min(1).max(100),
  company: z.string().max(100).optional(),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().min(1).max(20),
  country: z.string().min(1).max(100),
  isDefault: z.boolean().optional(),
})

// GET /api/addresses — list user's addresses
export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const addresses = await prisma.address.findMany({
    where: { userId: ctx.userId },
    orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
  })
  return NextResponse.json({ data: addresses })
})

// POST /api/addresses — create address
export const POST = withAuth(async (req: NextRequest, ctx) => {
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const count = await prisma.address.count({ where: { userId: ctx.userId } })
  const isDefault = parsed.data.isDefault ?? count === 0

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: ctx.userId },
      data: { isDefault: false },
    })
  }

  const address = await prisma.address.create({
    data: { ...parsed.data, userId: ctx.userId, isDefault },
  })

  return NextResponse.json({ data: address }, { status: 201 })
})
