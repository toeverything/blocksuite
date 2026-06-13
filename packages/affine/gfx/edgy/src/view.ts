import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@labre/affine-ext-loader';
import { extendTemplateCategory } from '@labre/affine-gfx-template';

import { effects } from './effects';
import { edgyTemplateCategory } from './templates';
import { EdgyFacetsRendererExtension } from './element-renderer';
import { EdgyInteraction, EdgyView } from './element-view';
import { EdgyNodeRendererExtension } from './node/node-renderer';
import { EdgyNodeView } from './node/node-view';
import { edgyToolbarExtension } from './toolbar/config';
import { edgyNodeToolbarExtension } from './toolbar/node-config';
import { edgySeniorTool } from './toolbar/senior-tool';

export class EdgyViewExtension extends ViewExtensionProvider {
  override name = 'affine-edgy-gfx';

  override effect(): void {
    super.effect();
    effects();
    extendTemplateCategory(edgyTemplateCategory);
  }

  override setup(context: ViewExtensionContext) {
    super.setup(context);
    context.register(EdgyView);
    context.register(EdgyFacetsRendererExtension);
    context.register(EdgyNodeView);
    context.register(EdgyNodeRendererExtension);
    if (this.isEdgeless(context.scope)) {
      context.register(EdgyInteraction);
      context.register(edgySeniorTool);
      context.register(edgyToolbarExtension);
      context.register(edgyNodeToolbarExtension);
    }
  }
}
