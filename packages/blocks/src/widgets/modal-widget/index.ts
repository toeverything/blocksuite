import { WidgetElement } from '@blocksuite/lit';
import { nothing } from 'lit';
import { customElement } from 'lit/decorators.js';

import { createCustomModal } from './modal.js';

@customElement('affine-modal-widget')
export class AffineModalWidget extends WidgetElement {
  open(options: Parameters<typeof createCustomModal>[0]) {
    return createCustomModal(options, this.ownerDocument.body);
  }

  override render() {
    return nothing;
  }
}
