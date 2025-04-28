import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/affine-ext-loader';
import { SlashMenuConfigExtension } from '@blocksuite/affine-widget-slash-menu';
import { BlockViewExtension, FlavourExtension } from '@blocksuite/std';
import { literal } from 'lit/static-html.js';

import { databaseSlashMenuConfig } from './configs/slash-menu.js';
import { effects } from './effects';

export class DatabaseViewExtension extends ViewExtensionProvider {
  override name = 'affine-database-block';

  override effect() {
    super.effect();
    effects();
  }

  override setup(context: ViewExtensionContext) {
    super.setup(context);
    context.register([
      FlavourExtension('affine:database'),
      BlockViewExtension('affine:database', literal`affine-database`),
      SlashMenuConfigExtension('affine:database', databaseSlashMenuConfig),
    ]);
  }
}
