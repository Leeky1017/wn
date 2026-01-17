import clsx from 'clsx'
import { useI18n } from '../i18n/state'

export type ActivityKey = 'library' | 'map' | 'search' | 'settings'

export function ActivityBar(props: {
  active: ActivityKey
  onSelect: (key: ActivityKey) => void
}) {
  const { dict, toggleLang } = useI18n()

  return (
    <nav className="activity-bar" aria-label="Activity Bar">
      <button
        className={clsx('act-icon', props.active === 'library' && 'active')}
        onClick={() => props.onSelect('library')}
        aria-label="Library"
        type="button"
      >
        <IconLibrary />
      </button>

      <button
        className={clsx('act-icon', props.active === 'map' && 'active')}
        onClick={() => props.onSelect('map')}
        aria-label="Story Map"
        type="button"
      >
        <IconLayers />
      </button>

      <button
        className={clsx('act-icon', props.active === 'search' && 'active')}
        onClick={() => props.onSelect('search')}
        aria-label="Search"
        type="button"
      >
        <IconSearch />
      </button>

      <div style={{ flex: 1 }} />

      <button className="lang-toggle" onClick={toggleLang} type="button" aria-label="Toggle language">
        {dict.langLabel}
      </button>

      <button
        className={clsx('act-icon', props.active === 'settings' && 'active')}
        onClick={() => props.onSelect('settings')}
        aria-label="Settings"
        type="button"
      >
        <IconSettings />
      </button>
    </nav>
  )
}

function IconLibrary() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function IconLayers() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 3.17 14H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.6 1.65 1.65 0 0 0 10 3.09V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
