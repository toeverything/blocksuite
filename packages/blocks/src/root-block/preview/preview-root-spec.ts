import {
  BlockViewExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { PageRootService } from '../page/page-root-service.js';

export const PreviewPageSpec: ExtensionType[] = [
  FlavourExtension('affine:page'),
  PageRootService,
  BlockViewExtension('affine:page', literal`affine-preview-root`),
];
