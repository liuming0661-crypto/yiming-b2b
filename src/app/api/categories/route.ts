import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

const CACHE_TTL = 3600 // 1 小时

export async function GET() {
  const cacheKey = 'categories:tree'

  const cached = await redis.get(cacheKey)
  if (cached) {
    return NextResponse.json({ data: cached })
  }

  // 只取顶级分类，children 通过 Prisma 递归关系获取
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: 'asc' },
    include: {
      children: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  await redis.setex(cacheKey, CACHE_TTL, categories)
  return NextResponse.json({ data: categories })
}
