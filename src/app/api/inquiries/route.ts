import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  country: z.string().max(80).optional(),
  productId: z.string().optional(),
  productName: z.string().max(200).optional(),
  quantity: z.number().int().positive().optional(),
  message: z.string().max(1000).optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const inquiry = await prisma.inquiry.create({ data: parsed.data })
  return NextResponse.json({ data: inquiry }, { status: 201 })
}
