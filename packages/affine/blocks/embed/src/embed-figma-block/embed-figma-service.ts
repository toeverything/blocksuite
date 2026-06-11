import {
  EmbedFigmaBlockSchema,
  EmbedFigmaStyles,
} from '@labre/affine-model';
import { EmbedOptionConfig } from '@labre/affine-shared/services';

import { figmaUrlRegex } from './embed-figma-model.js';

export const EmbedFigmaBlockOptionConfig = EmbedOptionConfig({
  flavour: EmbedFigmaBlockSchema.model.flavour,
  urlRegex: figmaUrlRegex,
  styles: EmbedFigmaStyles,
  viewType: 'embed',
});
