import { useEffect, useState } from 'react';
import { DocMeta } from '@blocksuite/store';
import { useEditor } from '../editor/context';
import { createDoc as createAndInitDoc } from '../editor/utils';

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

  const addDoc = () => {
    if (!collection || !provider) return;
    const doc = createAndInitDoc(collection);
    provider.connect(doc.id);
  };

  const deleteDoc = (docId: string) => {
    if (!provider || !collection) return;

    if (currentDocId === docId) {
      const index = docMetaInfos.findIndex(({ id }) => id === docId);
      if (index === 0) {
        if (docMetaInfos.length === 1) {
          const newDoc = createAndInitDoc(collection);
          provider.connect(newDoc.id);
        } else {
          provider.connect(docMetaInfos[1].id);
        }
      } else {
        provider.connect(docMetaInfos[index - 1].id);
      }
    }

    collection.removeDoc(docId);
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
          >
            <div
              className="doc-item-title"
              onClick={() => provider?.connect(id)}
            >
              {title || 'Untitled'}
            </div>
            <button className="del-doc" onClick={() => deleteDoc(id)}>
              ✖
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
