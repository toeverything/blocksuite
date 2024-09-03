import {
  BlockViewExtension,
  CommandExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { commands } from './commands/index.js';
import { ListBlockService } from './list-service.js';

export const ListBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:list'),
  ListBlockService,
  CommandExtension(commands),
  BlockViewExtension('affine:list', literal`affine-list`),
];
