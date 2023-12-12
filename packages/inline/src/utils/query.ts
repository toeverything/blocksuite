import { assertExists } from '@blocksuite/global/utils';

import { INLINE_ROOT_ATTR } from '../consts.js';
import type { InlineEditor, InlineRootElement } from '../inline-editor.js';
import type { BaseTextAttributes } from './base-attributes.js';

export function findDocumentOrShadowRoot<
  TextAttributes extends BaseTextAttributes,
>(editor: InlineEditor<TextAttributes>): Document {
  const el = editor.rootElement;

  if (!el) {
    throw new Error('editor root element not found');
  }

  const root = el.getRootNode();

  if (
    (root instanceof Document || root instanceof ShadowRoot) &&
    'getSelection' in root
  ) {
    return root;
  }

  return el.ownerDocument;
}

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
