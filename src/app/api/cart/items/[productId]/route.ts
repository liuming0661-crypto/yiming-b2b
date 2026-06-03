import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth'
import { redis } from '@/lib/redis'
import { prisma } from '@/lib/prisma'
import { getPriceForQty, calcSubtotal } from '@/lib/shared'
import type { CartItem, PriceTier } from '@/lib/shared'

const CART_TTL = 60 * 60 * 24 * 7

function cartKey(userId: string) {
  return `cart:${userId}`
}

function getProductId(req: NextRequest): string {
  const segments = new URL(req.url).pathname.split('/')
  return segments[segments.length - 1]
}

const updateSchema = z.object({
  quantity: z.number().int().positive(),
})

// PUT /api/cart/items/[productId] — update quantity
export const PUT = withAuth(async (req: NextRequest, ctx) => {
  const productId = getProductId(req)

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { quantity } = parsed.data

  const items = (await redis.get<CartItem[]>(cartKey(ctx.userId))) ?? []
  const idx = items.findIndex(i => i.productId === productId)

  if (idx < 0) {
    return NextResponse.json({ error: 'Item not in cart' }, { status: 404 })
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
    select: { moq: true, priceTiers: true },
  })

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  if (quantity < product.moq) {
    return NextResponse.json(
      { error: `Minimum order quantity is ${product.moq}` },
      { status: 400 },
    )
  }

  const tiers = product.priceTiers as unknown as PriceTier[]
  items[idx] = {
    ...items[idx],
    quantity,
    unitPriceUsd: getPriceForQty(tiers, quantity),
    subtotalUsd: calcSubtotal(tiers, quantity),
  }

  await redis.setex(cartKey(ctx.userId), CART_TTL, items)
  const total = items.reduce((sum, i) => sum + i.subtotalUsd, 0)
  return NextResponse.json({ data: { items, total } })
})

// DELETE /api/cart/items/[productId] — remove item
export const DELETE = withAuth(async (req: NextRequest, ctx) => {
  const productId = getProductId(req)

  const items = (await redis.get<CartItem[]>(cartKey(ctx.userId))) ?? []
  const filtered = items.filter(i => i.productId !== productId)

  if (filtered.length === items.length) {
    return NextResponse.json({ error: 'Item not in cart' }, { status: 404 })
  }

  if (filtered.length === 0) {
    await redis.del(cartKey(ctx.userId))
  } else {
    await redis.setex(cartKey(ctx.userId), CART_TTL, filtered)
  }

  const total = filtered.reduce((sum, i) => sum + i.subtotalUsd, 0)
  return NextResponse.json({ data: { items: filtered, total } })
})
