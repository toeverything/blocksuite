import { createRoot } from 'react-dom/client';

export async function createViewer(value: Record<string, unknown>) {
  const { JsonViewer } = await import('@rich-data/viewer');
  const inspector = document.getElementById('inspector') as HTMLElement;
  const root = createRoot(inspector);
  root.render(
    <JsonViewer
      style={{
        position: 'fixed',
        backgroundColor: 'white',
        zIndex: '1002',
        width: '30vw',
        height: '50vh',
        right: '30px',
        top: '30px',
        overflow: 'auto',
      }}
      value={value}
    />
  );
}
