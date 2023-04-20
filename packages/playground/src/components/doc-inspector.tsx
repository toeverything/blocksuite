// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@rich-data/viewer/theme/basic.css';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@rich-data/json-plugin/theme/basic.css';

export async function createViewer(value: Record<string, unknown>) {
  const { createRoot } = await import('react-dom/client');
  const { createViewerHook } = await import('@rich-data/viewer');
  const { createJsonPlugins } = await import('@rich-data/json-plugin');
  const inspector = document.getElementById('inspector') as HTMLElement;
  const { Viewer, Provider } = createViewerHook({
    plugins: createJsonPlugins(),
  });
  const root = createRoot(inspector);
  const App = () => {
    return <Viewer value={value} />;
  };
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
      <Provider>
        <App />
      </Provider>
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
