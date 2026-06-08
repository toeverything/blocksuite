import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/affine-ext-loader';

import { effects } from './effects';
import { WardleyElementRendererExtension } from './element-renderer';
import { WardleyInteraction, WardleyView } from './element-view';
import { WardleyNodeRendererExtension } from './node/node-renderer';
import { WardleyNodeView } from './node/node-view';
import { wardleyNodeToolbarExtension } from './toolbar/node-config';
import { wardleyToolbarExtension } from './toolbar/config';
import { wardleySeniorTool } from './toolbar/senior-tool';

export class WardleyViewExtension extends ViewExtensionProvider {
  override name = 'affine-wardley-gfx';

  override effect(): void {
    super.effect();
    effects();
  }

  override setup(context: ViewExtensionContext) {
    super.setup(context);
    context.register(WardleyView);
    context.register(WardleyElementRendererExtension);
    context.register(WardleyNodeView);
    context.register(WardleyNodeRendererExtension);
    if (this.isEdgeless(context.scope)) {
      context.register(WardleyInteraction);
      context.register(wardleySeniorTool);
      context.register(wardleyToolbarExtension);
      context.register(wardleyNodeToolbarExtension);
    }
  }
}
