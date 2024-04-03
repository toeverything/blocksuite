import React, { useEffect, useState } from 'react';
import { initEditor } from '../editor/editor';
import { AffineEditorContainer } from '@blocksuite/presets';
import { CollectionProvider } from '../editor/provider/provider';
import { EditorContext } from '../editor/context';

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  const [editor, setEditor] = useState<AffineEditorContainer | null>(null);
  const [provider, setProvider] = useState<CollectionProvider | null>(null);
  const updateProvider = (newProvider: CollectionProvider) => {
    setProvider(newProvider);
  };

  useEffect(() => {
    initEditor().then(({ editor, provider }) => {
      setEditor(editor);
      setProvider(provider);
    });
  }, []);

  return (
    <EditorContext.Provider
      value={{
        editor,
        provider,
        updateProvider,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};
