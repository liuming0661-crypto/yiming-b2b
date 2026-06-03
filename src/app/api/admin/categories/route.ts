import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

const createSchema = z.object({
  nameEn: z.string().min(1).max(100),
  nameAr: z.string().max(100).default(''),
  slug: z.string().max(100).regex(/^[a-z0-9-]*$/).optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().default(0),
})

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// GET /api/admin/categories
export const GET = withAdmin(async () => {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
    include: { _count: { select: { products: true } } },
  })
  return NextResponse.json({ data: categories })
})

// POST /api/admin/categories
export const POST = withAdmin(async (req: NextRequest) => {
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const slug = parsed.data.slug || toSlug(parsed.data.nameEn)

  const existing = await prisma.category.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: 'Slug already exists — try a different name or slug' }, { status: 409 })
  }

  const category = await prisma.category.create({
    data: { ...parsed.data, slug },
  })
  await redis.del('categories:tree')
  return NextResponse.json({ data: category }, { status: 201 })
})
