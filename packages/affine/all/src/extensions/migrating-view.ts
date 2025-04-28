import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/affine-ext-loader';

import { effects } from './effects';
import {
  MigratingEdgelessEditorBlockSpecs,
  MigratingPageEditorBlockSpecs,
  MigratingPreviewEdgelessEditorBlockSpecs,
  MigratingPreviewPageEditorBlockSpecs,
} from './migrating';

export class MigratingViewExtension extends ViewExtensionProvider {
  override name = 'migrating';

  override effect() {
    super.effect();
    effects();
  }

  override setup(context: ViewExtensionContext) {
    super.setup(context);
    const scope = context.scope;
    if (scope === 'preview-page') {
      context.register(MigratingPreviewPageEditorBlockSpecs);
      return;
    }
    if (scope === 'preview-edgeless') {
      context.register(MigratingPreviewEdgelessEditorBlockSpecs);
      return;
    }
    if (scope === 'page' || scope === 'mobile-page') {
      context.register(MigratingPageEditorBlockSpecs);
      return;
    }
    if (scope === 'edgeless' || scope === 'mobile-edgeless') {
      context.register(MigratingEdgelessEditorBlockSpecs);
      return;
    }
  }
}
