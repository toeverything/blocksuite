import { AFFINE_LINKED_DOC_WIDGET, AffineLinkedDocWidget } from './index.js';
import { LinkedDocPopover } from './linked-doc-popover.js';

export function effects() {
  customElements.define('affine-linked-doc-popover', LinkedDocPopover);
  customElements.define(AFFINE_LINKED_DOC_WIDGET, AffineLinkedDocWidget);
}
