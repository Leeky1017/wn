export function StatusBar(props: { left: string; right: string }) {
  return (
    <footer className="status-bar" aria-label="Status bar">
      <div>{props.left}</div>
      <div>{props.right}</div>
    </footer>
  )
}

