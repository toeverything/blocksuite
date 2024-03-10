import React, { useEffect, useState } from 'react';
import { initEditor } from '../editor/editor';
import { AffineEditorContainer } from '@blocksuite/presets';
import { DocCollection } from '@blocksuite/store';
import { Provider } from '../editor/provider/provider';
import { EditorContext } from '../editor/context';

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  const [editor, setEditor] = useState<AffineEditorContainer | null>(null);
  const [collection, setCollection] = useState<DocCollection | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const updateCollection = (newCollection: DocCollection) => {
    setCollection(newCollection);
  };

  useEffect(() => {
    initEditor().then(({ editor, collection, provider }) => {
      setEditor(editor);
      setCollection(collection);
      setProvider(provider);
    });
  }, []);

  return (
    <EditorContext.Provider
      value={{
        editor,
        collection,
        provider,
        updateCollection,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};
