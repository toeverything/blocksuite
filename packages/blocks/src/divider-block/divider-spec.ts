import { BlockViewExtension, type ExtensionType } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

export const DividerBlockSpec: ExtensionType[] = [
  BlockViewExtension('affine:divider', literal`affine-divider`),
];
