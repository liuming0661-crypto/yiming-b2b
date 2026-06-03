import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyIdToken } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'
import { UserStatus } from '@/lib/shared'

const registerSchema = z.object({
  companyName: z.string().min(1).max(200),
  country: z.string().length(2),
  contactName: z.string().min(1).max(100),
  phone: z.string().optional(),
  licenseImage: z.string().url().optional(),
})

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let decoded: Awaited<ReturnType<typeof verifyIdToken>>
  try {
    decoded = await verifyIdToken(token)
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const existing = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } })
  if (existing) {
    return NextResponse.json({ data: existing }, { status: 200 })
  }

  const body = await req.json()
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const user = await prisma.user.create({
    data: {
      firebaseUid: decoded.uid,
      email: decoded.email!,
      status: UserStatus.ACTIVE,
      ...parsed.data,
    },
  })

  return NextResponse.json({ data: user }, { status: 201 })
}
