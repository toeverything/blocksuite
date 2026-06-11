import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@labre/affine-ext-loader';
import { SlashMenuConfigExtension } from '@labre/affine-widget-slash-menu';
import { BlockViewExtension, FlavourExtension } from '@labre/std';
import { literal } from 'lit/static-html.js';

import { CalloutKeymapExtension } from './callout-keymap';
import { calloutSlashMenuConfig } from './configs/slash-menu';
import { effects } from './effects';

export class CalloutViewExtension extends ViewExtensionProvider {
  override name = 'affine-callout-block';

  override effect() {
    super.effect();
    effects();
  }

  override setup(context: ViewExtensionContext) {
    super.setup(context);
    context.register([
      FlavourExtension('affine:callout'),
      BlockViewExtension('affine:callout', literal`affine-callout`),
      CalloutKeymapExtension,
      SlashMenuConfigExtension('affine:callout', calloutSlashMenuConfig),
    ]);
  }
}
