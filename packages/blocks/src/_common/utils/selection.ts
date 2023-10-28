import { IS_FIREFOX } from '@blocksuite/global/env';
import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { type VRange } from '@blocksuite/virgo';

import { matchFlavours } from './model.js';
import { asyncGetRichTextByModel, getDocPage } from './query.js';
import type { SelectionPosition } from './types.js';

declare global {
  interface Document {
    // firefox API
    caretPositionFromPoint(
      x: number,
      y: number
    ): {
      offsetNode: Node;
      offset: number;
    };
  }
}

export async function asyncSetVRange(
  model: BaseBlockModel,
  vRange: VRange
): Promise<void> {
  const richText = await asyncGetRichTextByModel(model);
  if (!richText) {
    return;
  }

  await richText.updateComplete;
  const vEditor = richText.vEditor;
  assertExists(vEditor);
  vEditor.setVRange(vRange);
}

export function asyncFocusRichText(
  page: Page,
  id: string,
  vRange: VRange = { index: 0, length: 0 }
) {
  const model = page.getBlockById(id);
  assertExists(model);
  if (matchFlavours(model, ['affine:divider'])) return;
  asyncSetVRange(model, vRange).catch(e => {
    console.error(e);
  });
}

function caretRangeFromPoint(clientX: number, clientY: number): Range | null {
  if (IS_FIREFOX) {
    const caret = document.caretPositionFromPoint(clientX, clientY);
    // TODO handle caret is covered by popup
    const range = document.createRange();
    range.setStart(caret.offsetNode, caret.offset);
    return range;
  }

  const range = document.caretRangeFromPoint(clientX, clientY);

  if (!range) {
    return null;
  }

  // See https://github.com/toeverything/blocksuite/issues/1382
  const rangeRects = range?.getClientRects();
  if (
    rangeRects &&
    rangeRects.length === 2 &&
    range.startOffset === range.endOffset &&
    clientY < rangeRects[0].y + rangeRects[0].height
  ) {
    const deltaX = (rangeRects[0].x | 0) - (rangeRects[1].x | 0);

    if (deltaX > 0) {
      range.setStart(range.startContainer, range.startOffset - 1);
      range.setEnd(range.endContainer, range.endOffset - 1);
    }
  }
  return range;
}

/**
 * As the title is a text area, this function does not yet have support for `SelectionPosition`.
 */
export function focusTitle(page: Page, index = Infinity, len = 0) {
  // TODO support SelectionPosition
  const pageComponent = getDocPage(page);
  if (!pageComponent) {
    throw new Error("Can't find page component!");
  }
  if (!pageComponent.titleVEditor) {
    throw new Error("Can't find title vEditor!");
  }
  if (index > pageComponent.titleVEditor.yText.length) {
    index = pageComponent.titleVEditor.yText.length;
  }
  pageComponent.titleVEditor.setVRange({ index, length: len });
}

export function focusBlockByModel(
  model: BaseBlockModel,
  position: SelectionPosition = 'end'
) {
  if (matchFlavours(model, ['affine:note', 'affine:page'])) {
    throw new Error("Can't focus note or page!");
  }

  asyncFocusRichText(
    model.page,
    model.id,
    position === 'start'
      ? { index: 0, length: 0 }
      : {
          index: model.text?.length ?? 0,
          length: 0,
        }
  );
}

export function resetNativeSelection(range: Range | null) {
  const selection = window.getSelection();
  assertExists(selection);
  selection.removeAllRanges();
  range && selection.addRange(range);
}

/**
 * Return true if has native selection in the document.
 *
 * @example
 * ```ts
 * const isNativeSelection = hasNativeSelection();
 * if (isNativeSelection) {
 *   // do something
 * }
 * ```
 */
export function hasNativeSelection() {
  const selection = window.getSelection();
  if (!selection) return false;

  // The `selection.rangeCount` attribute must return 0
  // if this is empty or either focus or anchor is not in the document tree,
  // and must return 1 otherwise.
  return !!selection.rangeCount;
}

export function getCurrentNativeRange(selection = window.getSelection()) {
  // When called on an <iframe> that is not displayed (e.g., where display: none is set) Firefox will return null
  // See https://developer.mozilla.org/en-US/docs/Web/API/Window/getSelection for more details
  if (!selection) {
    throw new Error('Failed to get current range, selection is null');
  }
  // Before the user has clicked a freshly loaded page, the rangeCount is 0.
  // The rangeCount will usually be 1.
  // But scripting can be used to make the selection contain more than one range.
  // See https://developer.mozilla.org/en-US/docs/Web/API/Selection/rangeCount for more details.
  if (selection.rangeCount === 0) {
    throw new Error('Failed to get current range, rangeCount is 0');
  }
  if (selection.rangeCount > 1) {
    console.warn('getCurrentRange may be wrong, rangeCount > 1');
  }
  return selection.getRangeAt(0);
}

export function handleNativeRangeAtPoint(x: number, y: number) {
  const range = caretRangeFromPoint(x, y);
  const startContainer = range?.startContainer;
  // click on rich text
  if (startContainer instanceof Node) {
    resetNativeSelection(range);
  }
}
