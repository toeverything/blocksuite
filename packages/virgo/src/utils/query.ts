import { assertExists } from '@blocksuite/global/utils';

import type { VEditor, VirgoRootElement } from '../virgo.js';
import type { BaseTextAttributes } from './base-attributes.js';

export function findDocumentOrShadowRoot<
  TextAttributes extends BaseTextAttributes
>(editor: VEditor<TextAttributes>): Document {
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

export function getVEditorInsideRoot(element: Element): VEditor {
  const rootElement = element.closest(
    '[data-virgo-root="true"]'
  ) as VirgoRootElement;
  assertExists(rootElement, 'element must be inside a v-root');
  const virgoEditor = rootElement.virgoEditor;
  assertExists(
    virgoEditor,
    'element must be inside a v-root with virgo-editor'
  );
  return virgoEditor;
}
