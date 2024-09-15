import {
  BlockViewExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { EmbedFigmaBlockService } from './embed-figma-service.js';

export const EmbedFigmaBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:embed-figma'),
  EmbedFigmaBlockService,
  BlockViewExtension('affine:embed-figma', model => {
    return model.parent?.flavour === 'affine:surface'
      ? literal`affine-embed-edgeless-figma-block`
      : literal`affine-embed-figma-block`;
  }),
];
