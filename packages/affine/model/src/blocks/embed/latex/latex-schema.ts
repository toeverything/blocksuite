import { createEmbedBlockSchema } from '../../../utils/helper.js';
import {
  EmbedLatexBlockModel,
  type EmbedLatexBlockProps,
} from './latex-model.js';

export const EmbedLatexBlockSchema = createEmbedBlockSchema({
  name: 'latex',
  version: 1,
  toModel: () => new EmbedLatexBlockModel(),
  props: (): EmbedLatexBlockProps => ({
    latex: '',
  }),
});
