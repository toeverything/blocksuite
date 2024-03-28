import { useEffect, useState } from 'react';
import { DocMeta } from '@blocksuite/store';
import { useEditor } from '../editor/context.js';
import { createDoc } from '../editor/utils.js';

const Sidebar = () => {
  const { editor, collection, provider } = useEditor()!;
  const [docMetaInfos, setDocMetaInfos] = useState<DocMeta[]>([]);
  const [currentDocId, setCurrentDocId] = useState<string>('');

  useEffect(() => {
    if (!collection || !editor) return;

    const updateDocMetaInfos = () =>
      setDocMetaInfos([...collection.meta.docMetas]);
    const updateCurrentDocId = () => setCurrentDocId(editor.doc.id);

    updateDocMetaInfos();
    updateCurrentDocId();

    const disposable = [
      collection.meta.docMetaUpdated.on(updateDocMetaInfos),
      editor.slots.docUpdated.on(updateCurrentDocId),
    ];

    return () => disposable.forEach(d => d?.dispose());
  }, [collection, editor]);

  const addDoc = async () => {
    if (!collection) return;
    createDoc(collection);
  };

  return (
    <div className="sidebar">
      <div className="header">All Docs</div>
      <div className="doc-actions">
        <button onClick={addDoc}>Add Doc</button>
      </div>
      <div className="doc-list">
        {docMetaInfos.map(({ id, title }) => (
          <div
            className={`doc-item ${currentDocId === id ? 'active' : ''}`}
            key={id}
            onClick={() => provider?.connect(id)}
          >
            {title || 'Untitled'}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
