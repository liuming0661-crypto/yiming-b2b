// Inlined from packages/shared — kept in sync manually

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  PREPARING = 'PREPARING',
  SHIPPED = 'SHIPPED',
  CUSTOMS = 'CUSTOMS',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  STRIPE = 'STRIPE',
  TT_WIRE = 'TT_WIRE',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  PAID = 'PAID',
}

export enum ShipmentStatus {
  PREPARING = 'PREPARING',
  SHIPPED = 'SHIPPED',
  IN_CUSTOMS = 'IN_CUSTOMS',
  DELIVERED = 'DELIVERED',
}

export const SUPPORTED_LOCALES = ['en', 'ar'] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

export const MIN_ORDER_USD = 500

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PriceTier {
  minQty: number
  unitPriceUsd: number
}

export interface ProductSpec {
  material?: string
  origin?: string
  weight?: string
  dimensions?: string
  [key: string]: string | undefined
}

export interface User {
  id: string
  firebaseUid: string
  email: string
  companyName: string
  country: string
  contactName: string
  phone?: string
  status: UserStatus
  licenseImage?: string
  createdAt: string
}

export interface Category {
  id: string
  nameEn: string
  nameAr: string
  nameZh?: string
  slug: string
  parentId?: string
  children?: Category[]
  sortOrder: number
}

export interface Product {
  id: string
  sku: string
  nameEn: string
  nameAr: string
  nameZh?: string
  descEn?: string
  descAr?: string
  descZh?: string
  categoryId: string
  category?: Category
  moq: number
  priceTiers: PriceTier[]
  images: string[]
  specs?: ProductSpec
  isActive: boolean
  createdAt: string
}

export interface Address {
  id: string
  userId: string
  fullName: string
  company?: string
  line1: string
  line2?: string
  city: string
  state?: string
  postalCode: string
  country: string
  isDefault: boolean
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  product?: Product
  quantity: number
  unitPriceUsd: number
  subtotalUsd: number
}

export interface Shipment {
  id: string
  orderId: string
  trackingNumber?: string
  carrier?: string
  status: ShipmentStatus
  documents?: ShipmentDocument[]
  estimatedDelivery?: string
}

export interface ShipmentDocument {
  type: 'bill_of_lading' | 'customs_declaration' | 'invoice' | 'other'
  url: string
  uploadedAt: string
}

export interface Payment {
  id: string
  orderId: string
  method: PaymentMethod
  amountUsd: number
  status: PaymentStatus
  receiptUrl?: string
  stripeId?: string
  verifiedAt?: string
  createdAt: string
}

export interface Order {
  id: string
  orderNumber: string
  buyerId: string
  buyer?: User
  shippingAddrId?: string
  shippingAddr?: Address
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  totalUsd: number
  notes?: string
  items?: OrderItem[]
  shipment?: Shipment
  payments?: Payment[]
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface CartItem {
  productId: string
  product: Product
  quantity: number
  unitPriceUsd: number
  subtotalUsd: number
}

// ─── Utils ────────────────────────────────────────────────────────────────────

export function getPriceForQty(tiers: PriceTier[], qty: number): number {
  const sorted = [...tiers].sort((a, b) => b.minQty - a.minQty)
  const tier = sorted.find(t => qty >= t.minQty)
  return tier ? tier.unitPriceUsd : sorted[sorted.length - 1].unitPriceUsd
}

export function calcSubtotal(tiers: PriceTier[], qty: number): number {
  return getPriceForQty(tiers, qty) * qty
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
