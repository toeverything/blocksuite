import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@labre/affine-ext-loader';
import { extendTemplateCategory } from '@labre/affine-gfx-template';

import { effects } from './effects';
import { wardleyTemplateCategory } from './templates';
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
    extendTemplateCategory(wardleyTemplateCategory);
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
