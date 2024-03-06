import { AffineEditorContainer } from '@blocksuite/presets';
import { Workspace } from '@blocksuite/store';
import { createContext, useContext } from 'react';

export const EditorContext = createContext<{
  editor: AffineEditorContainer;
  workspace: Workspace;
} | null>(null);

export function useEditor() {
  return useContext(EditorContext);
}
