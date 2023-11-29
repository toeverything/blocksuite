import { EmbedBlockModel } from '../_common/embed-block-helper/index.js';
import { EdgelessSelectableMixin } from '../surface-block/elements/selectable.js';
import type { EmbedGithubBlockProps } from './types.js';

@EdgelessSelectableMixin
export class EmbedGithubBlockModel extends EmbedBlockModel<EmbedGithubBlockProps> {}
