export function PreviewPane(props: { html: string }) {
  return (
    <div className="paper-wrapper" aria-label="Preview">
      <div className="preview-overlay">
        <div style={{ padding: 18 }} dangerouslySetInnerHTML={{ __html: props.html }} />
      </div>
    </div>
  )
}

