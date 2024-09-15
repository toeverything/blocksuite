import { BlockViewExtension, type ExtensionType } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

export const FrameBlockSpec: ExtensionType[] = [
  BlockViewExtension('affine:frame', literal`affine-frame`),
];
