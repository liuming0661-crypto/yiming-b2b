'use client'
import { useWishlist } from '@/hooks/use-wishlist'

interface Props {
  productId: string
  className?: string
}

export function WishlistButton({ productId, className = '' }: Props) {
  const { toggle, has } = useWishlist()
  const saved = has(productId)

  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(productId) }}
      aria-label={saved ? 'Remove from saved' : 'Save product'}
      className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-150
        ${saved ? 'bg-red-500 text-white shadow' : 'bg-white/80 text-gray-400 hover:text-red-500 hover:bg-white shadow-sm'}
        ${className}`}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  )
}
