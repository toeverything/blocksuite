import { JSX, createContext, useContext } from 'solid-js';
import { initEditor, AppState } from '../editor/editor';

const EditorContext = createContext<AppState>();

export function EditorProvider(props: { children: JSX.Element }) {
  const appState = initEditor();

  return (
    <EditorContext.Provider value={appState}>
      {props.children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  return useContext(EditorContext);
}
