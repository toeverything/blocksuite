import { BlockViewExtension, type ExtensionType } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

export const LatexBlockSpec: ExtensionType[] = [
  BlockViewExtension('affine:latex', literal`affine-latex`),
];
