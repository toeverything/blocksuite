import { WidgetComponent } from '@blocksuite/block-std';
import { nothing } from 'lit';

import { createCustomModal } from './custom-modal.js';

export const AFFINE_MODAL_WIDGET = 'affine-modal-widget';

export class AffineModalWidget extends WidgetComponent {
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
