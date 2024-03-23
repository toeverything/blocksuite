import { useAppState, useDocs } from './data';

export const Sidebar = () => {
  const docs = useDocs();
  const [appState, updateAppState] = useAppState();

  return (
    <div className="sidebar">
      <div className="header">All Docs</div>
      <div className="doc-list">
        {docs.map(doc => (
          <div
            className={`doc-item ${appState.activeDocId === doc.id ? 'active' : ''}`}
            key={doc.id}
            onClick={() => {
              updateAppState(state => {
                return {
                  ...state,
                  activeDocId: doc.id,
                };
              });
            }}
          >
            {doc.meta?.title || 'Untitled'}
          </div>
        ))}
      </div>
    </div>
  );
};
