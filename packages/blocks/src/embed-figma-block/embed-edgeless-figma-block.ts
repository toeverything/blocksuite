import { customElement } from 'lit/decorators.js';

import { toEdgelessEmbedBlock } from '../_common/embed-block-helper/embed-block-element.js';
import { EmbedFigmaBlockComponent } from './embed-figma-block.js';

@customElement('affine-embed-edgeless-figma-block')
export class EmbedEdgelessBlockComponent extends toEdgelessEmbedBlock(
  EmbedFigmaBlockComponent
) {
  override rootServiceFlavour: string = 'affine:page';
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-embed-edgeless-figma-block': EmbedEdgelessBlockComponent;
  }
}
