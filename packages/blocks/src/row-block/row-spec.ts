import {
  BlockViewExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { RowBlockService } from './row-service.js';

export const RowBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:row'),
  RowBlockService,
  BlockViewExtension('affine:row', literal`affine-row`),
];
