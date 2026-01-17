import { useI18n } from '../../i18n/state'

export type StoryMapNode = {
  title: string
  detail: string
  depth: number
}

export function StoryMap(props: { nodes: StoryMapNode[]; onRegenerate: () => void; loading?: boolean }) {
  const { dict } = useI18n()

  return (
    <>
      <div className="sidebar-header">{dict.mapHead}</div>
      <div style={{ padding: 10 }}>
        {props.nodes.map((n, idx) => (
          <div key={`${idx}-${n.title}`} className="map-node" style={{ marginLeft: 20 + (n.depth - 1) * 14 }}>
            <div className="map-title">{n.title}</div>
            <div className="map-detail">{n.detail}</div>
          </div>
        ))}

        <div style={{ marginTop: 15, paddingLeft: 20 }}>
          <button
            className="btn-primary-studio"
            style={{ fontSize: 10, opacity: props.loading ? 0.6 : 0.8 }}
            onClick={props.onRegenerate}
            disabled={props.loading}
            type="button"
          >
            {dict.mapRefresh}
          </button>
        </div>
      </div>
    </>
  )
}
