import React from 'react';
import { initEditor } from '../editor/editor';
import { EditorContext } from '../editor/context';

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  const { editor, workspace } = initEditor();

  return (
    <EditorContext.Provider value={{ editor, workspace }}>
      {children}
    </EditorContext.Provider>
  );
};
