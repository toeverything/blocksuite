import { AffineEditorContainer } from '@blocksuite/presets';
import { DocCollection } from '@blocksuite/store';
import React, { useEffect, useState } from 'react';
import { EditorContext } from '../editor/context.js';
import { initEditor } from '../editor/editor.js';
import { Provider } from '../editor/provider.js';

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  const [editor, setEditor] = useState<AffineEditorContainer | null>(null);
  const [collection, setCollection] = useState<DocCollection | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);

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
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};
