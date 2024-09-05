import { customElement } from 'lit/decorators.js';

import { toEdgelessEmbedBlock } from '../_common/embed-block-helper/embed-block-element.js';
import { EmbedYoutubeBlockComponent } from './embed-youtube-block.js';

@customElement('affine-embed-edgeless-youtube-block')
export class EmbedEdgelessYoutubeBlockComponent extends toEdgelessEmbedBlock(
  EmbedYoutubeBlockComponent
) {}
