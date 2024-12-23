import {
  BlockViewExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { CellBlockService } from './cell-service.js';

export const CellBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:cell'),
  CellBlockService,
  BlockViewExtension('affine:cell', literal`affine-cell`),
];
