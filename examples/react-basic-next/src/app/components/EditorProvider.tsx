'use client';

import React from 'react';
import { initEditor } from '../editor/editor';
import { EditorContext } from '../editor/context';

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  const { editor, collection } = initEditor();

  return (
    <EditorContext.Provider value={{ editor, collection }}>
      {children}
    </EditorContext.Provider>
  );
};
