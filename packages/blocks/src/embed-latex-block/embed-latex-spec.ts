import {
  BlockViewExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

export const EmbedLatexBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:embed-latex'),
  BlockViewExtension('affine:embed-latex', () => {
    return literal`affine-embed-latex-block`;
  }),
];
