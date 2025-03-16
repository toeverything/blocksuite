import { EmbedFigmaBlockSchema } from '@blocksuite/affine-model';
import { ToolbarModuleExtension } from '@blocksuite/affine-shared/services';
import { SlashMenuConfigExtension } from '@blocksuite/affine-widget-slash-menu';
import {
  BlockServiceIdentifier,
  BlockViewExtension,
  FlavourExtension,
} from '@blocksuite/block-std';
import type { ExtensionType } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

import { createBuiltinToolbarConfigForExternal } from '../configs/toolbar';
import { EmbedFigmaBlockAdapterExtensions } from './adapters/extension';
import { embedFigmaSlashMenuConfig } from './configs/slash-menu';
import { EmbedFigmaBlockComponent } from './embed-figma-block';
import { EmbedFigmaBlockOptionConfig } from './embed-figma-service';

const flavour = EmbedFigmaBlockSchema.model.flavour;

export const EmbedFigmaBlockSpec: ExtensionType[] = [
  FlavourExtension(flavour),
  BlockViewExtension(flavour, model => {
    return model.parent?.flavour === 'affine:surface'
      ? literal`affine-embed-edgeless-figma-block`
      : literal`affine-embed-figma-block`;
  }),
  EmbedFigmaBlockAdapterExtensions,
  EmbedFigmaBlockOptionConfig,
  ToolbarModuleExtension({
    id: BlockServiceIdentifier(flavour),
    config: createBuiltinToolbarConfigForExternal(EmbedFigmaBlockComponent),
  }),
  SlashMenuConfigExtension(flavour, embedFigmaSlashMenuConfig),
].flat();
