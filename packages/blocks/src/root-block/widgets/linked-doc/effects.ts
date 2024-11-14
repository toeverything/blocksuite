import { ImportDoc } from './import-doc/import-doc.js';
import { AFFINE_LINKED_DOC_WIDGET, AffineLinkedDocWidget } from './index.js';
import { LinkedDocPopover } from './linked-doc-popover.js';
import { AffineMobileLinkedDocMenu } from './mobile-linked-doc-menu.js';

export function effects() {
  customElements.define('affine-linked-doc-popover', LinkedDocPopover);
  customElements.define(AFFINE_LINKED_DOC_WIDGET, AffineLinkedDocWidget);
  customElements.define('import-doc', ImportDoc);

  customElements.define(
    'affine-mobile-linked-doc-menu',
    AffineMobileLinkedDocMenu
  );
}
