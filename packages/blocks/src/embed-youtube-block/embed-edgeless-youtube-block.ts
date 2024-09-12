import { toEdgelessEmbedBlock } from '../_common/embed-block-helper/embed-block-element.js';
import { EmbedYoutubeBlockComponent } from './embed-youtube-block.js';

export class EmbedEdgelessYoutubeBlockComponent extends toEdgelessEmbedBlock(
  EmbedYoutubeBlockComponent
) {}
