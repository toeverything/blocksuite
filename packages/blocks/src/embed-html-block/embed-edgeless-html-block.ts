import type { EdgelessRootService } from '../root-block/index.js';

import { toEdgelessEmbedBlock } from '../_common/embed-block-helper/embed-block-element.js';
import { EmbedHtmlBlockComponent } from './embed-html-block.js';

export class EmbedEdgelessHtmlBlockComponent extends toEdgelessEmbedBlock(
  EmbedHtmlBlockComponent
) {
  get rootService() {
    return this.std.getService('affine:page') as EdgelessRootService;
  }
}
