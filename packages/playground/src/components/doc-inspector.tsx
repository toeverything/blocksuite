export async function createViewer(value: Record<string, unknown>) {
  const { createRoot } = await import('react-dom/client');
  const { JsonViewer } = await import('@rich-data/viewer');
  const inspector = document.getElementById('inspector') as HTMLElement;
  const root = createRoot(inspector);
  root.render(
    <div
      style={{
        position: 'absolute',
        backgroundColor: 'white',
        zIndex: '1002',
        width: '30vw',
        height: '50vh',
        right: '30px',
        top: '30px',
        overflow: 'auto',
      }}
    >
      <JsonViewer value={value} />
      <button
        style={{
          position: 'absolute',
          padding: '0',
          width: '20px',
          height: '20px',
          top: '0',
          right: '0',
        }}
        onClick={() => {
          root.unmount();
        }}
      >
        X
      </button>
    </div>
  );
}
