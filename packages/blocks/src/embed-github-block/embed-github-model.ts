import { EmbedModel } from '../_common/embed-block-generator/index.js';
import { EdgelessSelectableMixin } from '../surface-block/elements/selectable.js';
import type { EmbedGithubBlockProps } from './types.js';

@EdgelessSelectableMixin
export class EmbedGithubBlockModel extends EmbedModel<EmbedGithubBlockProps> {}
