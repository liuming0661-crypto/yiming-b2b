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

const addItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
})

// POST /api/cart/items — add or replace item
export const POST = withAuth(async (req: NextRequest, ctx) => {
  const body = await req.json()
  const parsed = addItemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { productId, quantity } = parsed.data

  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
    select: {
      id: true, sku: true, nameEn: true, nameAr: true,
      moq: true, priceTiers: true, images: true,
      categoryId: true, isActive: true, createdAt: true,
    },
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
  const unitPriceUsd = getPriceForQty(tiers, quantity)
  const subtotalUsd = calcSubtotal(tiers, quantity)

  const items = (await redis.get<CartItem[]>(cartKey(ctx.userId))) ?? []
  const idx = items.findIndex(i => i.productId === productId)

  const cartItem: CartItem = {
    productId,
    product: { ...product, priceTiers: tiers, createdAt: product.createdAt.toISOString() },
    quantity,
    unitPriceUsd,
    subtotalUsd,
  }

  if (idx >= 0) {
    items[idx] = cartItem
  } else {
    items.push(cartItem)
  }

  await redis.setex(cartKey(ctx.userId), CART_TTL, items)
  const total = items.reduce((sum, i) => sum + i.subtotalUsd, 0)
  return NextResponse.json({ data: { items, total } })
})
