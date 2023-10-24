import { WidgetElement } from '@blocksuite/lit';
import { nothing } from 'lit';
import { customElement } from 'lit/decorators.js';

import { createCustomModal } from './modal.js';

export const AFFINE_MODAL_WIDGET = 'affine-modal-widget';

@customElement(AFFINE_MODAL_WIDGET)
export class AffineModalWidget extends WidgetElement {
  open(options: Parameters<typeof createCustomModal>[0]) {
    return createCustomModal(options, this.ownerDocument.body);
  }

  override render() {
    return nothing;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_MODAL_WIDGET]: AffineModalWidget;
  }
}
