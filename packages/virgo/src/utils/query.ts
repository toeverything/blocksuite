import type { VEditor } from '../virgo.js';
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
