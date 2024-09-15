import {
  BlockViewExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { EmbedYoutubeBlockService } from './embed-youtube-service.js';

export const EmbedYoutubeBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:embed-youtube'),
  EmbedYoutubeBlockService,
  BlockViewExtension('affine:embed-youtube', model => {
    return model.parent?.flavour === 'affine:surface'
      ? literal`affine-embed-edgeless-youtube-block`
      : literal`affine-embed-youtube-block`;
  }),
];
