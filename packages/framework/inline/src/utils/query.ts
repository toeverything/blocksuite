import { assertExists } from '@blocksuite/global/utils';

import { INLINE_ROOT_ATTR } from '../consts.js';
import type { InlineEditor, InlineRootElement } from '../inline-editor.js';

export function getInlineEditorInsideRoot(element: Element): InlineEditor {
  const rootElement = element.closest(
    `[${INLINE_ROOT_ATTR}]`
  ) as InlineRootElement;
  assertExists(rootElement, 'element must be inside a v-root');
  const inlineEditor = rootElement.inlineEditor;
  assertExists(
    inlineEditor,
    'element must be inside a v-root with inline-editor'
  );
  return inlineEditor;
}
