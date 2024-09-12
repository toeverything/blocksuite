import { toEdgelessEmbedBlock } from '../_common/embed-block-helper/embed-block-element.js';
import { EmbedFigmaBlockComponent } from './embed-figma-block.js';

export class EmbedEdgelessBlockComponent extends toEdgelessEmbedBlock(
  EmbedFigmaBlockComponent
) {}

declare global {
  interface HTMLElementTagNameMap {
    'affine-embed-edgeless-figma-block': EmbedEdgelessBlockComponent;
  }
}
