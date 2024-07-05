import { useEffect, useState } from 'react';
import { Doc } from '@blocksuite/store';
import { useEditor } from '../editor/context';

const Sidebar = () => {
  const { provider, editor } = useEditor()!;
  const [docs, setDocs] = useState<Doc[]>([]);

  useEffect(() => {
    if (!provider || !editor) return;
    const { collection } = provider;
    const updateDocs = () => {
      const docs = [...collection.docs.values()].map(blocks => blocks.getDoc());
      setDocs(docs);
    };
    updateDocs();

    const disposable = [
      collection.slots.docUpdated.on(updateDocs),
      editor.slots.docLinkClicked.on(updateDocs),
    ];

    return () => disposable.forEach(d => d.dispose());
  }, [provider, editor]);

  return (
    <div className="sidebar">
      <div className="header">All Docs</div>
      <div className="doc-list">
        {docs.map(doc => (
          <div
            className={`doc-item ${editor?.doc === doc ? 'active' : ''}`}
            key={doc.id}
            onClick={() => {
              if (editor) editor.doc = doc;
              const docs = [...provider!.collection.docs.values()].map(blocks =>
                blocks.getDoc()
              );
              setDocs(docs);
            }}
          >
            {doc.meta?.title || 'Untitled'}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
