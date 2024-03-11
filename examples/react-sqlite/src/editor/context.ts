import { AffineEditorContainer } from '@blocksuite/presets';
import { DocCollection } from '@blocksuite/store';
import { createContext, useContext } from 'react';
import { Provider } from './provider/provider';

export interface EditorContextType {
  editor: AffineEditorContainer | null;
  collection: DocCollection | null;
  provider: Provider | null;
  updateCollection: (newCollection: DocCollection) => void;
}

export const EditorContext = createContext<EditorContextType | null>(null);

export function useEditor() {
  return useContext(EditorContext);
}
