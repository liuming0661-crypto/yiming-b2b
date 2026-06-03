import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth'
import { redis } from '@/lib/redis'
import { prisma } from '@/lib/prisma'
import { getPriceForQty, calcSubtotal, MIN_ORDER_USD } from '@/lib/shared'
import type { CartItem, PriceTier } from '@/lib/shared'
import { PaymentMethod } from '@/lib/shared'

function cartKey(userId: string) {
  return `cart:${userId}`
}

function generateOrderNumber(): string {
  const now = new Date()
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const rand = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
  return `YM-${ym}-${rand}`
}

const createOrderSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod),
  shippingAddrId: z.string().optional(),
  notes: z.string().max(500).optional(),
})

// POST /api/orders — create order from cart
export const POST = withAuth(async (req: NextRequest, ctx) => {
  const body = await req.json()
  const parsed = createOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const cartItems = (await redis.get<CartItem[]>(cartKey(ctx.userId))) ?? []
  if (cartItems.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  // Re-validate products and recalculate prices from DB
  const productIds = cartItems.map(i => i.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true, moq: true, priceTiers: true, isActive: true },
  })

  const productMap = new Map(products.map(p => [p.id, p]))

  // Validate each item
  const orderItems: { productId: string; quantity: number; unitPriceUsd: number; subtotalUsd: number }[] = []
  for (const item of cartItems) {
    const product = productMap.get(item.productId)
    if (!product) {
      return NextResponse.json(
        { error: `Product ${item.productId} is no longer available` },
        { status: 400 },
      )
    }
    if (item.quantity < product.moq) {
      return NextResponse.json(
        { error: `Quantity for product ${item.productId} is below MOQ (${product.moq})` },
        { status: 400 },
      )
    }
    const tiers = product.priceTiers as unknown as PriceTier[]
    orderItems.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPriceUsd: getPriceForQty(tiers, item.quantity),
      subtotalUsd: calcSubtotal(tiers, item.quantity),
    })
  }

  const totalUsd = orderItems.reduce((sum, i) => sum + i.subtotalUsd, 0)
  if (totalUsd < MIN_ORDER_USD) {
    return NextResponse.json(
      { error: `Minimum order total is $${MIN_ORDER_USD}. Current total: $${totalUsd.toFixed(2)}` },
      { status: 400 },
    )
  }

  // Validate shipping address belongs to user
  if (parsed.data.shippingAddrId) {
    const addr = await prisma.address.findFirst({
      where: { id: parsed.data.shippingAddrId, userId: ctx.userId },
    })
    if (!addr) {
      return NextResponse.json({ error: 'Invalid shipping address' }, { status: 400 })
    }
  }

  // Generate unique order number (retry on collision)
  let orderNumber = generateOrderNumber()
  let attempts = 0
  while (attempts < 5) {
    const exists = await prisma.order.findUnique({ where: { orderNumber } })
    if (!exists) break
    orderNumber = generateOrderNumber()
    attempts++
  }

  const order = await prisma.order.create({
    data: {
      orderNumber,
      buyerId: ctx.userId,
      shippingAddrId: parsed.data.shippingAddrId,
      paymentMethod: parsed.data.paymentMethod,
      totalUsd,
      notes: parsed.data.notes,
      items: {
        create: orderItems,
      },
    },
    include: {
      items: {
        include: { product: { select: { nameEn: true, nameAr: true, sku: true, images: true } } },
      },
    },
  })

  // Clear cart after successful order
  await redis.del(cartKey(ctx.userId))

  return NextResponse.json({ data: order }, { status: 201 })
})

// GET /api/orders — list buyer's orders
export const GET = withAuth(async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(20, Math.max(1, Number(searchParams.get('pageSize') ?? 10)))
  const skip = (page - 1) * pageSize

  const where = { buyerId: ctx.userId }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        totalUsd: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ])

  return NextResponse.json({ data: orders, total, page, pageSize })
})
