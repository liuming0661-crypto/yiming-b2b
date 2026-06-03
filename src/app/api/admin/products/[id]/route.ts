import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { algoliaAdmin, PRODUCTS_INDEX } from '@/lib/algolia'

function getProductId(req: NextRequest): string {
  const segments = new URL(req.url).pathname.split('/')
  return segments[segments.length - 1]
}

const priceTierSchema = z.object({
  minQty: z.number().int().positive(),
  unitPriceUsd: z.number().positive(),
})

const updateSchema = z.object({
  nameEn: z.string().min(1).max(200).optional(),
  nameAr: z.string().max(200).optional(),
  nameZh: z.string().max(200).optional(),
  descEn: z.string().optional(),
  descAr: z.string().optional(),
  descZh: z.string().optional(),
  categoryId: z.string().optional(),
  moq: z.number().int().positive().optional(),
  priceTiers: z.array(priceTierSchema).min(1).optional(),
  images: z.array(z.string().url()).optional(),
  specs: z.record(z.string()).optional(),
  isActive: z.boolean().optional(),
})

async function invalidateProductCache(id: string) {
  const keys = await redis.keys('products:*')
  await Promise.all([
    redis.del(`product:${id}`),
    keys.length > 0 ? redis.del(...keys) : Promise.resolve(),
  ])
}

// GET /api/admin/products/[id]
export const GET = withAdmin(async (req: NextRequest) => {
  const id = getProductId(req)
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: { select: { nameEn: true, nameAr: true, slug: true } } },
  })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  return NextResponse.json({ data: product })
})

// PUT /api/admin/products/[id]
export const PUT = withAdmin(async (req: NextRequest) => {
  const id = getProductId(req)
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const product = await prisma.product.update({
    where: { id },
    data: parsed.data,
  }).catch(() => null)

  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  // Sync to Algolia
  try {
    if (product.isActive) {
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
    } else {
      // Remove inactive products from search index
      await algoliaAdmin.deleteObject({ indexName: PRODUCTS_INDEX, objectID: product.id })
    }
  } catch (err) {
    console.error('Algolia sync failed:', err)
  }

  await invalidateProductCache(id)
  return NextResponse.json({ data: product })
})

// DELETE /api/admin/products/[id]
export const DELETE = withAdmin(async (req: NextRequest) => {
  const id = getProductId(req)

  const product = await prisma.product.findUnique({
    where: { id },
    select: { _count: { select: { orderItems: true } } },
  })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  if (product._count.orderItems > 0) {
    // Soft delete: just deactivate
    await prisma.product.update({ where: { id }, data: { isActive: false } })
    try {
      await algoliaAdmin.deleteObject({ indexName: PRODUCTS_INDEX, objectID: id })
    } catch (err) {
      console.error('Algolia delete failed:', err)
    }
    await invalidateProductCache(id)
    return NextResponse.json({ data: { deleted: false, deactivated: true } })
  }

  await prisma.product.delete({ where: { id } })
  try {
    await algoliaAdmin.deleteObject({ indexName: PRODUCTS_INDEX, objectID: id })
  } catch (err) {
    console.error('Algolia delete failed:', err)
  }
  await invalidateProductCache(id)
  return NextResponse.json({ data: { deleted: true } })
})
