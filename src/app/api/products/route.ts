import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

const CACHE_TTL = 300 // 5 分钟

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') ?? 20)))
  const categoryId = searchParams.get('categoryId') ?? undefined
  const skip = (page - 1) * pageSize

  const cacheKey = `products:${categoryId ?? 'all'}:${page}:${pageSize}`

  const cached = await redis.get(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  const where = { isActive: true, ...(categoryId ? { categoryId } : {}) }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        sku: true,
        nameEn: true,
        nameAr: true,
        nameZh: true,
        categoryId: true,
        category: { select: { nameEn: true, nameAr: true, nameZh: true, slug: true } },
        moq: true,
        priceTiers: true,
        images: true,
      },
    }),
    prisma.product.count({ where }),
  ])

  const result = { data: products, total, page, pageSize }
  await redis.setex(cacheKey, CACHE_TTL, result)

  return NextResponse.json(result)
}
