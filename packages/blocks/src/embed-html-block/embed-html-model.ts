import { EmbedBlockModel } from '../_common/embed-block-helper/index.js';
import { EdgelessSelectableMixin } from '../surface-block/elements/selectable.js';

export type EmbedHtmlBlockProps = {
  html?: string;
  design?: string;
};

@EdgelessSelectableMixin
export class EmbedHtmlBlockModel extends EmbedBlockModel<EmbedHtmlBlockProps> {}
