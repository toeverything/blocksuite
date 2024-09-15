import {
  BlockViewExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { EmbedSyncedDocBlockService } from './embed-synced-doc-service.js';

export const EmbedSyncedDocBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:embed-synced-doc'),
  EmbedSyncedDocBlockService,
  BlockViewExtension('affine:embed-synced-doc', model => {
    return model.parent?.flavour === 'affine:surface'
      ? literal`affine-embed-edgeless-synced-doc-block`
      : literal`affine-embed-synced-doc-block`;
  }),
];
