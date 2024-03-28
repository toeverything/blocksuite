import { AffineEditorContainer } from '@blocksuite/presets';
import { DocCollection } from '@blocksuite/store';
import { createContext, useContext } from 'react';
import { Provider } from './provider';

export const EditorContext = createContext<{
  editor: AffineEditorContainer | null;
  collection: DocCollection | null;
  provider: Provider | null;
} | null>(null);

export function useEditor() {
  return useContext(EditorContext);
}
