import {
  BlockViewExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { FrameBlockService } from './frame-service.js';

export const FrameBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:frame'),
  FrameBlockService,
  BlockViewExtension('affine:frame', literal`affine-frame`),
];
