import { AffineEditorContainer } from '@blocksuite/presets';
import { DocCollection } from '@blocksuite/store';
import { createContext, useContext } from 'react';

export const EditorContext = createContext<{
  editor: AffineEditorContainer;
  collection: DocCollection;
} | null>(null);

export function useEditor() {
  return useContext(EditorContext);
}
