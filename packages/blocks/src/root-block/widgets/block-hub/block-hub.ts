import { WidgetElement } from '@blocksuite/block-std';
import { customElement } from 'lit/decorators.js';

import { BlockHub } from './components/block-hub.js';
import { styles } from './styles.js';

export const AFFINE_BLOCK_HUB_WIDGET = 'affine-block-hub-widget';

@customElement(AFFINE_BLOCK_HUB_WIDGET)
export class BlockHubWidget extends WidgetElement {
  static override styles = styles;

  override connectedCallback() {
    super.connectedCallback();

    // FIXME(Flrande): It is not a best practice,
    // but merely a temporary measure for reusing previous components.
    const blockHub = new BlockHub(this.host);
    document.body.append(blockHub);

    this.disposables.add(() => blockHub.remove());
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_BLOCK_HUB_WIDGET]: BlockHubWidget;
  }
}
