import { SlashMenuConfigExtension } from '@blocksuite/affine-widget-slash-menu';
import {
  BlockViewExtension,
  FlavourExtension,
  WidgetViewExtension,
} from '@blocksuite/block-std';
import type { ExtensionType } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

import { ImageBlockAdapterExtensions } from './adapters/extension';
import { imageSlashMenuConfig } from './configs/slash-menu.js';
import { ImageProxyService } from './image-proxy-service';
import { ImageBlockService, ImageDropOption } from './image-service';

const flavour = 'affine:image';

export const imageToolbarWidget = WidgetViewExtension(
  'affine:image',
  'imageToolbar',
  literal`affine-image-toolbar-widget`
);

export const ImageBlockSpec: ExtensionType[] = [
  FlavourExtension(flavour),
  ImageBlockService,
  BlockViewExtension(flavour, model => {
    const parent = model.doc.getParent(model.id);

    if (parent?.flavour === 'affine:surface') {
      return literal`affine-edgeless-image`;
    }

    return literal`affine-image`;
  }),
  imageToolbarWidget,
  ImageDropOption,
  ImageBlockAdapterExtensions,
  SlashMenuConfigExtension('affine:image', imageSlashMenuConfig),
].flat();

export const ImageStoreSpec: ExtensionType[] = [ImageProxyService];
