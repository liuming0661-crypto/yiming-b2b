import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { algoliaAdmin, PRODUCTS_INDEX } from '@/lib/algolia'

const priceTierSchema = z.object({
  minQty: z.number().int().positive(),
  unitPriceUsd: z.number().positive(),
})

const createSchema = z.object({
  sku: z.string().min(1).max(50),
  nameEn: z.string().min(1).max(200),
  nameAr: z.string().max(200).default(''),
  nameZh: z.string().max(200).optional(),
  descEn: z.string().optional(),
  descAr: z.string().optional(),
  descZh: z.string().optional(),
  categoryId: z.string().min(1),
  moq: z.number().int().positive(),
  priceTiers: z.array(priceTierSchema).min(1),
  images: z.array(z.string().url()).default([]),
  specs: z.record(z.string()).optional(),
  isActive: z.boolean().default(true),
})

async function syncToAlgolia(product: {
  id: string; sku: string; nameEn: string; nameAr: string
  descEn?: string | null; descAr?: string | null
  categoryId: string; moq: number; priceTiers: unknown
  images: string[]; isActive: boolean; createdAt: Date
}) {
  try {
    await algoliaAdmin.saveObject({
      indexName: PRODUCTS_INDEX,
      body: {
        objectID: product.id,
        sku: product.sku,
        nameEn: product.nameEn,
        nameAr: product.nameAr,
        descEn: product.descEn ?? '',
        descAr: product.descAr ?? '',
        categoryId: product.categoryId,
        moq: product.moq,
        priceTiers: product.priceTiers,
        images: product.images,
        isActive: product.isActive,
        createdAt: product.createdAt.toISOString(),
      },
    })
  } catch (err) {
    console.error('Algolia sync failed:', err)
  }
}

// GET /api/admin/products
export const GET = withAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? 20)))
  const q = searchParams.get('q')?.trim() ?? ''
  const categoryId = searchParams.get('categoryId') ?? ''
  const skip = (page - 1) * pageSize

  const where = {
    ...(q ? {
      OR: [
        { nameEn: { contains: q, mode: 'insensitive' as const } },
        { sku: { contains: q, mode: 'insensitive' as const } },
      ],
    } : {}),
    ...(categoryId ? { categoryId } : {}),
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { nameEn: true, slug: true } } },
    }),
    prisma.product.count({ where }),
  ])

  return NextResponse.json({ data: products, total, page, pageSize })
})

// POST /api/admin/products
export const POST = withAdmin(async (req: NextRequest) => {
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } })
  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 400 })
  }

  const existing = await prisma.product.findUnique({ where: { sku: parsed.data.sku } })
  if (existing) {
    return NextResponse.json({ error: 'SKU already exists' }, { status: 409 })
  }

  const product = await prisma.product.create({ data: parsed.data })

  // Sync to Algolia (non-blocking)
  syncToAlgolia(product)

  // Invalidate product list caches
  const keys = await redis.keys('products:*')
  if (keys.length > 0) await redis.del(...keys)

  return NextResponse.json({ data: product }, { status: 201 })
})
