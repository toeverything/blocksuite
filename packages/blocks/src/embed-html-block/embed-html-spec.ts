import {
  BlockViewExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { EmbedHtmlBlockService } from './embed-html-service.js';

export const EmbedHtmlBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:embed-html'),
  EmbedHtmlBlockService,
  BlockViewExtension('affine:embed-html', model => {
    return model.parent?.flavour === 'affine:surface'
      ? literal`affine-embed-edgeless-html-block`
      : literal`affine-embed-html-block`;
  }),
];
