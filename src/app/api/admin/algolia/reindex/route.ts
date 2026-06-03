import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { algoliaAdmin, PRODUCTS_INDEX } from '@/lib/algolia'

export const POST = withAdmin(async () => {
  // Configure index settings (filterable + searchable attributes)
  await algoliaAdmin.setSettings({
    indexName: PRODUCTS_INDEX,
    indexSettings: {
      searchableAttributes: ['nameEn', 'nameAr', 'sku', 'descEn', 'descAr'],
      attributesForFaceting: ['filterOnly(isActive)', 'filterOnly(categoryId)'],
    },
  })

  const products = await prisma.product.findMany({ where: { isActive: true } })

  const objects = products.map(p => ({
    objectID: p.id,
    sku: p.sku,
    nameEn: p.nameEn,
    nameAr: p.nameAr ?? '',
    descEn: p.descEn ?? '',
    descAr: p.descAr ?? '',
    categoryId: p.categoryId,
    moq: p.moq,
    priceTiers: p.priceTiers,
    images: p.images,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
  }))

  await algoliaAdmin.saveObjects({ indexName: PRODUCTS_INDEX, objects })

  return NextResponse.json({ synced: objects.length })
})
