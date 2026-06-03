import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

function getCategoryId(req: NextRequest): string {
  const segments = new URL(req.url).pathname.split('/')
  return segments[segments.length - 1]
}

const updateSchema = z.object({
  nameEn: z.string().min(1).max(100).optional(),
  nameAr: z.string().max(100).optional(),
  nameZh: z.string().max(100).optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
})

// PUT /api/admin/categories/[id]
export const PUT = withAdmin(async (req: NextRequest) => {
  const id = getCategoryId(req)
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const category = await prisma.category.update({
    where: { id },
    data: parsed.data,
  }).catch(() => null)

  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }
  await redis.del('categories:tree')
  return NextResponse.json({ data: category })
})

// DELETE /api/admin/categories/[id]
export const DELETE = withAdmin(async (req: NextRequest) => {
  const id = getCategoryId(req)

  const productCount = await prisma.product.count({ where: { categoryId: id } })
  if (productCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${productCount} products belong to this category` },
      { status: 409 },
    )
  }

  await prisma.category.delete({ where: { id } }).catch(() => null)
  await redis.del('categories:tree')
  return NextResponse.json({ data: { deleted: true } })
})
