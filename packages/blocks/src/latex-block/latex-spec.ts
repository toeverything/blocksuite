import {
  BlockViewExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import './latex-block.js';
import { LatexBlockService } from './latex-service.js';

export const LatexBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:latex'),
  LatexBlockService,
  BlockViewExtension('affine:latex', literal`affine-latex`),
];
