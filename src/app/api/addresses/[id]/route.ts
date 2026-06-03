import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function getAddressId(req: NextRequest): string {
  const segments = new URL(req.url).pathname.split('/')
  return segments[segments.length - 1]
}

// PATCH /api/addresses/[id] — set as default
export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  const id = getAddressId(req)

  const address = await prisma.address.findFirst({ where: { id, userId: ctx.userId } })
  if (!address) return NextResponse.json({ error: 'Address not found' }, { status: 404 })

  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId: ctx.userId }, data: { isDefault: false } }),
    prisma.address.update({ where: { id }, data: { isDefault: true } }),
  ])

  return NextResponse.json({ data: { id, isDefault: true } })
})

// DELETE /api/addresses/[id]
export const DELETE = withAuth(async (req: NextRequest, ctx) => {
  const id = getAddressId(req)

  const address = await prisma.address.findFirst({ where: { id, userId: ctx.userId } })
  if (!address) return NextResponse.json({ error: 'Address not found' }, { status: 404 })

  await prisma.address.delete({ where: { id } })

  // If deleted address was default, make the first remaining one default
  if (address.isDefault) {
    const first = await prisma.address.findFirst({ where: { userId: ctx.userId }, orderBy: { id: 'asc' } })
    if (first) await prisma.address.update({ where: { id: first.id }, data: { isDefault: true } })
  }

  return NextResponse.json({ data: { deleted: true } })
})
