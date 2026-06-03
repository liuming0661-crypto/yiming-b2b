import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

const CACHE_TTL = 300

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const cacheKey = `product:${id}`

  const cached = await redis.get(cacheKey)
  if (cached) {
    return NextResponse.json({ data: cached })
  }

  const product = await prisma.product.findFirst({
    where: { id, isActive: true },
    include: {
      category: { select: { nameEn: true, nameAr: true, nameZh: true, slug: true } },
    },
  })

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  await redis.setex(cacheKey, CACHE_TTL, product)
  return NextResponse.json({ data: product })
}
