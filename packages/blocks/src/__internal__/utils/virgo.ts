import type { Page } from '@blocksuite/store';
import type { VEditor } from '@blocksuite/virgo';

import { getEditorContainer } from './query.js';

export function setUpVirgoScroll(page: Page, vEditor: VEditor): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorContainer = getEditorContainer(page) as any;
  vEditor.shouldScrollIntoView = editorContainer.mode === 'page';
}
