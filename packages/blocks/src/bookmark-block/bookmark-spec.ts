import {
  BlockViewExtension,
  CommandExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import {
  BookmarkBlockService,
  BookmarkDragHandleOption,
} from './bookmark-service.js';
import { commands } from './commands/index.js';

export const BookmarkBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:bookmark'),
  BookmarkBlockService,
  CommandExtension(commands),
  BlockViewExtension('affine:bookmark', model => {
    return model.parent?.flavour === 'affine:surface'
      ? literal`affine-edgeless-bookmark`
      : literal`affine-bookmark`;
  }),
  BookmarkDragHandleOption,
];
