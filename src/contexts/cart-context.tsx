'use client'
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAuth } from './auth-context'

interface CartContextValue {
  count: number
  refresh: () => Promise<void>
  increment: (qty?: number) => void
  decrement: () => void
  reset: () => void
}

const CartContext = createContext<CartContextValue>({
  count: 0,
  refresh: async () => {},
  increment: () => {},
  decrement: () => {},
  reset: () => {},
})

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth()
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!token) { setCount(0); return }
    try {
      const res = await fetch('/api/cart', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) { setCount(0); return }
      const d = await res.json()
      const items: { quantity: number }[] = d?.data?.items ?? []
      setCount(items.reduce((sum, i) => sum + i.quantity, 0))
    } catch {
      setCount(0)
    }
  }, [token])

  useEffect(() => {
    if (user && token) {
      refresh()
    } else {
      setCount(0)
    }
  }, [user, token])

  const increment = (qty = 1) => setCount(c => c + qty)
  const decrement = () => setCount(c => Math.max(0, c - 1))
  const reset = () => setCount(0)

  return (
    <CartContext.Provider value={{ count, refresh, increment, decrement, reset }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
