import Preact from 'preact';
import { initEditor } from '../editor/editor';
import { EditorContext } from '../editor/context';

export const EditorProvider = ({ children }: { children: Preact.VNode }) => {
  const { editor, workspace } = initEditor();

  return (
    <EditorContext.Provider value={{ editor, workspace }}>
      {children}
    </EditorContext.Provider>
  );
};
