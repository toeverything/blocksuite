import { toEdgelessEmbedBlock } from '../_common/embed-block-helper/embed-block-element.js';
import { EmbedLoomBlockComponent } from './embed-loom-block.js';

export class EmbedEdgelessLoomBlockComponent extends toEdgelessEmbedBlock(
  EmbedLoomBlockComponent
) {}

declare global {
  interface HTMLElementTagNameMap {
    'affine-embed-edgeless-loom-block': EmbedEdgelessLoomBlockComponent;
  }
}
