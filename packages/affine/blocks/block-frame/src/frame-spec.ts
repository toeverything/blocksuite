import { BlockViewExtension } from '@blocksuite/block-std';
import type { ExtensionType } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const FrameBlockSpec: ExtensionType[] = [
  BlockViewExtension('affine:frame', literal`affine-frame`),
];
