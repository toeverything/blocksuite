import { EmbedLinkedDocBlockSchema } from '@blocksuite/affine-model';
import { ToolbarModuleExtension } from '@blocksuite/affine-shared/services';
import {
  BlockServiceIdentifier,
  BlockViewExtension,
} from '@blocksuite/block-std';
import type { ExtensionType } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

import { EmbedLinkedDocBlockAdapterExtensions } from './adapters/extension';
import { LinkedDocSlashMenuConfigExtension } from './configs/slash-menu';
import { builtinToolbarConfig } from './configs/toolbar';

const flavour = EmbedLinkedDocBlockSchema.model.flavour;

export const EmbedLinkedDocBlockSpec: ExtensionType[] = [
  BlockViewExtension(flavour, model => {
    return model.parent?.flavour === 'affine:surface'
      ? literal`affine-embed-edgeless-linked-doc-block`
      : literal`affine-embed-linked-doc-block`;
  }),
  EmbedLinkedDocBlockAdapterExtensions,
  ToolbarModuleExtension({
    id: BlockServiceIdentifier(flavour),
    config: builtinToolbarConfig,
  }),
  LinkedDocSlashMenuConfigExtension,
].flat();
