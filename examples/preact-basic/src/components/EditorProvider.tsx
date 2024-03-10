import Preact from 'preact';
import { initEditor } from '../editor/editor';
import { EditorContext } from '../editor/context';

export const EditorProvider = ({ children }: { children: Preact.VNode }) => {
  const { editor, collection } = initEditor();

  return (
    <EditorContext.Provider value={{ editor, collection }}>
      {children}
    </EditorContext.Provider>
  );
};
