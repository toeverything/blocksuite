import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@labre/affine-ext-loader';

import { effects } from './effects';
import { edgelessZoomToolbarWidget } from './index';

export class EdgelessZoomToolbarViewExtension extends ViewExtensionProvider {
  override name = 'affine-edgeless-zoom-toolbar-widget';

  override effect() {
    super.effect();
    effects();
  }

  override setup(context: ViewExtensionContext) {
    super.setup(context);
    if (this.isEdgeless(context.scope)) {
      context.register(edgelessZoomToolbarWidget);
    }
  }
}
