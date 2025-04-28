import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/affine-ext-loader';

import { effects } from './effects';
import { linkedDocWidget } from './widget';

export class LinkedDocViewExtension extends ViewExtensionProvider {
  override name = 'affine-linked-doc-widget';

  override effect() {
    super.effect();
    effects();
  }

  override setup(context: ViewExtensionContext) {
    super.setup(context);
    context.register(linkedDocWidget);
  }
}
