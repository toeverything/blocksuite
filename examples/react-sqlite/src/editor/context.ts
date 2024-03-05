import { AffineEditorContainer } from '@blocksuite/presets';
import { Workspace } from '@blocksuite/store';
import { createContext, useContext } from 'react';
import { Provider } from './provider/provider';

export interface EditorContextType {
  editor: AffineEditorContainer | null;
  workspace: Workspace | null;
  provider: Provider | null;
  updateWorkspace: (newWorkspace: Workspace) => void;
}

export const EditorContext = createContext<EditorContextType | null>(null);

export function useEditor() {
  return useContext(EditorContext);
}
