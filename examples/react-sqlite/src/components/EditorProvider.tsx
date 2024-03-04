import React, { useEffect, useState } from 'react';
import { initEditor } from '../editor/editor';
import { AffineEditorContainer } from '@blocksuite/presets';
import { Workspace } from '@blocksuite/store';
import { Provider } from '../editor/provider/provider';
import { EditorContext } from '../editor/context';

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  const [editor, setEditor] = useState<AffineEditorContainer | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const updateWorkspace = (newWorkspace: Workspace) => {
    setWorkspace(newWorkspace);
  };

  useEffect(() => {
    initEditor().then(({ editor, workspace, provider }) => {
      setEditor(editor);
      setWorkspace(workspace);
      setProvider(provider);
    });
  }, []);

  return (
    <EditorContext.Provider
      value={{ editor, workspace, provider, updateWorkspace }}
    >
      {children}
    </EditorContext.Provider>
  );
};
