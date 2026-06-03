import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'toys' },
      update: {},
      create: { nameEn: 'Toys & Games', nameAr: 'ألعاب وترفيه', slug: 'toys', sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { slug: 'accessories' },
      update: {},
      create: { nameEn: 'Fashion Accessories', nameAr: 'إكسسوارات الموضة', slug: 'accessories', sortOrder: 2 },
    }),
    prisma.category.upsert({
      where: { slug: 'electronics' },
      update: {},
      create: { nameEn: 'Electronics & Gadgets', nameAr: 'إلكترونيات وأجهزة', slug: 'electronics', sortOrder: 3 },
    }),
    prisma.category.upsert({
      where: { slug: 'household' },
      update: {},
      create: { nameEn: 'Household Items', nameAr: 'مستلزمات المنزل', slug: 'household', sortOrder: 4 },
    }),
  ])

  console.log(`✓ Created ${categories.length} categories`)

  // Products
  const products = [
    {
      sku: 'TOY-001',
      nameEn: 'Colorful Building Blocks Set (100pcs)',
      nameAr: 'مجموعة مكعبات بناء ملونة (100 قطعة)',
      descEn: 'High-quality ABS plastic building blocks for children aged 3+. Non-toxic, safe, and durable. Perfect for wholesale export.',
      descAr: 'مكعبات بناء عالية الجودة من البلاستيك ABS للأطفال من سن 3 سنوات فما فوق.',
      categoryId: categories[0].id,
      moq: 200,
      priceTiers: [
        { minQty: 200, unitPriceUsd: 4.50 },
        { minQty: 500, unitPriceUsd: 3.80 },
        { minQty: 1000, unitPriceUsd: 3.20 },
      ],
      images: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
        'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&q=80',
      ],
      isActive: true,
    },
    {
      sku: 'TOY-002',
      nameEn: 'Remote Control Car - Off-Road 4WD',
      nameAr: 'سيارة بريموت كنترول - دفع رباعي للطرق الوعرة',
      descEn: 'High-speed 4WD off-road RC car with 2.4GHz remote control. Speed up to 30km/h. Rechargeable battery included.',
      descAr: 'سيارة ريموت كنترول دفع رباعي عالية السرعة مع جهاز تحكم عن بعد 2.4GHz.',
      categoryId: categories[0].id,
      moq: 100,
      priceTiers: [
        { minQty: 100, unitPriceUsd: 12.00 },
        { minQty: 300, unitPriceUsd: 10.50 },
        { minQty: 600, unitPriceUsd: 9.00 },
      ],
      images: [
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80',
      ],
      isActive: true,
    },
    {
      sku: 'ACC-001',
      nameEn: 'Stainless Steel Chain Necklace Set',
      nameAr: 'طقم قلائد سلسلة من الفولاذ المقاوم للصدأ',
      descEn: 'Elegant 18K gold-plated stainless steel necklace. Tarnish-resistant, suitable for all skin types. Set of 3 designs.',
      descAr: 'قلادة فولاذ مقاوم للصدأ مطلية بالذهب عيار 18 قيراط. مقاومة للتأكسد.',
      categoryId: categories[1].id,
      moq: 500,
      priceTiers: [
        { minQty: 500, unitPriceUsd: 1.80 },
        { minQty: 1000, unitPriceUsd: 1.50 },
        { minQty: 3000, unitPriceUsd: 1.20 },
      ],
      images: [
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80',
        'https://images.unsplash.com/photo-1573408301185-9519f94815ef?w=600&q=80',
      ],
      isActive: true,
    },
    {
      sku: 'ACC-002',
      nameEn: 'Silicone Sport Watch Band (20mm)',
      nameAr: 'حزام ساعة رياضية من السيليكون (20 مم)',
      descEn: 'Compatible with most 20mm smart watches. Soft, breathable silicone. Available in 10 colors per pack.',
      descAr: 'متوافق مع معظم الساعات الذكية بعرض 20 مم. سيليكون ناعم وقابل للتنفس.',
      categoryId: categories[1].id,
      moq: 300,
      priceTiers: [
        { minQty: 300, unitPriceUsd: 1.20 },
        { minQty: 1000, unitPriceUsd: 0.95 },
        { minQty: 5000, unitPriceUsd: 0.75 },
      ],
      images: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
      ],
      isActive: true,
    },
    {
      sku: 'ELEC-001',
      nameEn: 'USB-C 65W GaN Fast Charger',
      nameAr: 'شاحن سريع USB-C بقدرة 65 واط GaN',
      descEn: 'Compact GaN technology fast charger. Supports PD3.0, QC4.0+. Compatible with laptops, phones, and tablets. Universal voltage 100-240V.',
      descAr: 'شاحن سريع مدمج بتقنية GaN. يدعم PD3.0 وQC4.0+. متوافق مع أجهزة الكمبيوتر المحمول والهواتف.',
      categoryId: categories[2].id,
      moq: 200,
      priceTiers: [
        { minQty: 200, unitPriceUsd: 8.50 },
        { minQty: 500, unitPriceUsd: 7.20 },
        { minQty: 1000, unitPriceUsd: 6.00 },
      ],
      images: [
        'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&q=80',
      ],
      isActive: true,
    },
    {
      sku: 'HH-001',
      nameEn: 'Stainless Steel Vacuum Thermos (500ml)',
      nameAr: 'ترمس فراغي من الفولاذ المقاوم للصدأ (500 مل)',
      descEn: 'Double-wall vacuum insulated thermos. Keeps drinks hot 12h / cold 24h. BPA-free, leak-proof lid. 500ml capacity.',
      descAr: 'ترمس معزول بالفراغ بجدار مزدوج. يحافظ على حرارة المشروبات 12 ساعة وبرودتها 24 ساعة.',
      categoryId: categories[3].id,
      moq: 100,
      priceTiers: [
        { minQty: 100, unitPriceUsd: 6.80 },
        { minQty: 500, unitPriceUsd: 5.50 },
        { minQty: 1000, unitPriceUsd: 4.50 },
      ],
      images: [
        'https://images.unsplash.com/photo-1544100485-1e1e5a5c4e1c?w=600&q=80',
        'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80',
      ],
      isActive: true,
    },
  ]

  let created = 0
  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    })
    created++
  }

  console.log(`✓ Created ${created} products`)
  console.log('Seeding complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
