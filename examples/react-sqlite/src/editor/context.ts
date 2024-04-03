import { AffineEditorContainer } from '@blocksuite/presets';
import { createContext, useContext } from 'react';
import { CollectionProvider } from './provider/provider';

export interface EditorContextType {
  editor: AffineEditorContainer | null;
  provider: CollectionProvider | null;
  updateProvider: (newProvider: CollectionProvider) => void;
}

export const EditorContext = createContext<EditorContextType | null>(null);

export function useEditor() {
  return useContext(EditorContext);
}
