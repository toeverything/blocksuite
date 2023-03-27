import type { Page } from '@blocksuite/store';
import type { VEditor } from '@blocksuite/virgo';

import { getEditorContainer } from './query.js';

// When the user selects a range, check if it matches the previous selection.
// If it does, apply the marks from the previous selection.
// If it does not, remove the marks from the previous selection.
export function clearMarksOnDiscontinuousInput(vEditor: VEditor): void {
  let vRange = vEditor.getVRange();
  const dispose = vEditor.slots.vRangeUpdated.on(([r, t]) => {
    if (
      vRange &&
      r &&
      ((t === 'native' && r.index === vRange.index) ||
        (t !== 'native' && r.index === vRange.index + 1))
    ) {
      vRange = r;
    } else {
      vEditor.resetMarks();
      dispose.dispose();
    }
  });
}

export function setUpVirgoScroll(page: Page, vEditor: VEditor): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorContainer = getEditorContainer(page) as any;
  vEditor.shouldScrollIntoView = editorContainer.mode === 'page';
}

export function setUpVirgoAutofocus(page: Page, vEditor: VEditor): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorContainer = getEditorContainer(page) as any;
  vEditor.autofocus = editorContainer.autofocus;
}
