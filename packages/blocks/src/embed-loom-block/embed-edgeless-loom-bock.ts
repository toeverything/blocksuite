import { customElement } from 'lit/decorators.js';

import { toEdgelessEmbedBlock } from '../_common/embed-block-helper/embed-block-element.js';
import { EmbedLoomBlockComponent } from './embed-loom-block.js';

@customElement('affine-embed-edgeless-loom-block')
export class EmbedEdgelessLoomBlockComponent extends toEdgelessEmbedBlock(
  EmbedLoomBlockComponent
) {
  override rootServiceFlavour: string = 'affine:page';
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-embed-edgeless-loom-block': EmbedEdgelessLoomBlockComponent;
  }
}
