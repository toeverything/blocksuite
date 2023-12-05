import { WidgetElement } from '@blocksuite/lit';
import { customElement } from 'lit/decorators.js';

import { BlockHub } from './components/block-hub.js';
import { styles } from './styles.js';

export const AFFINE_BLOCK_HUB_WIDGET = 'affine-block-hub-widget';

@customElement(AFFINE_BLOCK_HUB_WIDGET)
export class BlockHubWidget extends WidgetElement {
  static override styles = styles;

  override connectedCallback() {
    super.connectedCallback();

    const blockHub = new BlockHub(this.root);
    document.body.appendChild(blockHub);

    this.disposables.add(() => blockHub.remove());
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_BLOCK_HUB_WIDGET]: BlockHubWidget;
  }
}
