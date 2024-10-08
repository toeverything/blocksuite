import { ImageSelectionExtension } from '@blocksuite/affine-shared/selection';
import {
  BlockViewExtension,
  CommandExtension,
  type ExtensionType,
  FlavourExtension,
  WidgetViewMapExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { commands } from './commands/index.js';
import { ImageBlockService, ImageDragHandleOption } from './image-service.js';

export const ImageBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:image'),
  ImageBlockService,
  CommandExtension(commands),
  BlockViewExtension('affine:image', model => {
    const parent = model.doc.getParent(model.id);

    if (parent?.flavour === 'affine:surface') {
      return literal`affine-edgeless-image`;
    }

    return literal`affine-image`;
  }),
  WidgetViewMapExtension('affine:image', {
    imageToolbar: literal`affine-image-toolbar-widget`,
  }),
  ImageDragHandleOption,
  ImageSelectionExtension,
];
