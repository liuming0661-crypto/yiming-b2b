import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const select = {
  id: true,
  email: true,
  companyName: true,
  contactName: true,
  country: true,
  phone: true,
  status: true,
  createdAt: true,
}

export const GET = withAuth(async (_req, ctx) => {
  const user = await prisma.user.findUnique({ where: { id: ctx.userId }, select })
  return NextResponse.json({ data: user })
})

const updateSchema = z.object({
  companyName: z.string().min(1).max(200).optional(),
  contactName: z.string().min(1).max(100).optional(),
  phone: z.string().max(30).optional(),
})

export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const user = await prisma.user.update({
    where: { id: ctx.userId },
    data: parsed.data,
    select,
  })
  return NextResponse.json({ data: user })
})
