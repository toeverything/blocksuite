import { useEffect, useState } from 'react';
import { Doc } from '@blocksuite/store';
import { useEditor } from '../editor/context';

const Sidebar = () => {
  const { workspace, editor } = useEditor()!;
  const [docs, setDocs] = useState<Doc[]>([]);

  useEffect(() => {
    if (!workspace || !editor) return;
    const updateDocs = () => {
      setDocs([...workspace.docs.values()]);
    };
    updateDocs();

    const disposable = [
      workspace.slots.docUpdated.on(updateDocs),
      editor.slots.docLinkClicked.on(updateDocs),
    ];

    return () => disposable.forEach(d => d.dispose());
  }, [workspace, editor]);

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
              setDocs([...workspace!.docs.values()]);
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
