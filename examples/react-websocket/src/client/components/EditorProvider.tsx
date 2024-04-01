import { AffineEditorContainer } from '@blocksuite/presets';
import { DocCollection } from '@blocksuite/store';
import React, { useEffect, useRef, useState } from 'react';
import { EditorContext } from '../editor/context';
import { initEditor } from '../editor/editor';
import { Provider } from '../editor/provider';

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  const [editor, setEditor] = useState<AffineEditorContainer | null>(null);
  const [collection, setCollection] = useState<DocCollection | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);

  const hasInitCalled = useRef(false);

  useEffect(() => {
    if (hasInitCalled.current) return;

    initEditor().then(({ editor, collection, provider }) => {
      setEditor(editor);
      setCollection(collection);
      setProvider(provider);
    });

    hasInitCalled.current = true;
  }, [hasInitCalled]);

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
