import React, { useEffect, useMemo, useState } from 'react'
import en from './en.json'
import zh from './zh.json'
import { I18nContext, type I18nDict, type I18nValue, type Lang } from './state'

function isLang(v: unknown): v is Lang {
  return v === 'en' || v === 'zh'
}

export function I18nProvider(props: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem('wn.lang')
      return isLang(stored) ? stored : 'zh'
    } catch {
      return 'zh'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('wn.lang', lang)
    } catch {
      // ignore
    }
    document.body.lang = lang
  }, [lang])

  const dict = (lang === 'en' ? en : zh) as I18nDict

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      toggleLang: () => setLang((prev) => (prev === 'en' ? 'zh' : 'en')),
      dict,
      t: (key) => {
        const v = dict[key]
        return typeof v === 'string' ? v : ''
      },
    }),
    [dict, lang],
  )

  return <I18nContext.Provider value={value}>{props.children}</I18nContext.Provider>
}
