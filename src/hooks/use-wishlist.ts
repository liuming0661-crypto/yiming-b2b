'use client'
import { useState, useEffect, useCallback } from 'react'

const KEY = 'yiming_wishlist'

function load(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

function save(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids))
}

export function useWishlist() {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => { setIds(load()) }, [])

  const toggle = useCallback((id: string) => {
    setIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      save(next)
      return next
    })
  }, [])

  const has = useCallback((id: string) => ids.includes(id), [ids])

  return { ids, count: ids.length, toggle, has }
}
