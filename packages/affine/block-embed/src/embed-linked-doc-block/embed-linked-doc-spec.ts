import {
  BlockViewExtension,
  CommandExtension,
  type ExtensionType,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { commands } from './commands/index.js';

export const EmbedLinkedDocBlockSpec: ExtensionType[] = [
  CommandExtension(commands),
  BlockViewExtension('affine:embed-linked-doc', model => {
    return model.parent?.flavour === 'affine:surface'
      ? literal`affine-embed-edgeless-linked-doc-block`
      : literal`affine-embed-linked-doc-block`;
  }),
];
