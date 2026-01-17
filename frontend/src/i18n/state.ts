import { createContext, useContext } from 'react'
import en from './en.json'

export type Lang = 'en' | 'zh'
export type I18nDict = typeof en

export type I18nValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  toggleLang: () => void
  dict: I18nDict
  t: (key: keyof I18nDict) => string
}

export const I18nContext = createContext<I18nValue | null>(null)

export function useI18n() {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used within <I18nProvider />')
  return value
}

