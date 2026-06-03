'use client'
import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { type Lang, type Translations, translations } from '@/lib/i18n'

const LOCALE_MAP: Record<Lang, string> = {
  'en': 'en-US',
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
}

interface LanguageContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: Translations
  formatDate: (date: string | Date, opts?: Intl.DateTimeFormatOptions) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: translations['en'],
  formatDate: (date) => new Date(date).toLocaleString(),
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null
    if (saved && translations[saved]) setLangState(saved)
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('lang', l)
  }

  const formatDate = useMemo(() => (date: string | Date, opts?: Intl.DateTimeFormatOptions) => {
    return new Date(date).toLocaleString(LOCALE_MAP[lang], opts)
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang], formatDate }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  return useContext(LanguageContext)
}
