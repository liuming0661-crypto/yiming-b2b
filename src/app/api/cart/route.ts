import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { redis } from '@/lib/redis'
import type { CartItem } from '@/lib/shared'

const CART_TTL = 60 * 60 * 24 * 7 // 7 days

function cartKey(userId: string) {
  return `cart:${userId}`
}

export const GET = withAuth(async (_req, ctx) => {
  const items = (await redis.get<CartItem[]>(cartKey(ctx.userId))) ?? []
  const total = items.reduce((sum, i) => sum + i.subtotalUsd, 0)
  return NextResponse.json({ data: { items, total } })
})

export const DELETE = withAuth(async (_req, ctx) => {
  await redis.del(cartKey(ctx.userId))
  return NextResponse.json({ data: { items: [], total: 0 } })
})

export { CART_TTL, cartKey }
