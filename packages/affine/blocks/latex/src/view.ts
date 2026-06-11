import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@labre/affine-ext-loader';
import { SlashMenuConfigExtension } from '@labre/affine-widget-slash-menu';
import { BlockViewExtension } from '@labre/std';
import { literal } from 'lit/static-html.js';

import { latexSlashMenuConfig } from './configs/slash-menu';
import { effects } from './effects';

export class LatexViewExtension extends ViewExtensionProvider {
  override name = 'affine-latex-block';

  override effect() {
    super.effect();
    effects();
  }

  override setup(context: ViewExtensionContext) {
    super.setup(context);
    context.register([
      BlockViewExtension('affine:latex', literal`affine-latex`),
      SlashMenuConfigExtension('affine:latex', latexSlashMenuConfig),
    ]);
  }
}
