import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@labre/affine-ext-loader';
import { extendTemplateCategory } from '@labre/affine-gfx-template';

import { CynefinRendererExtension } from './cynefin/element-renderer';
import { CynefinInteraction, CynefinView } from './cynefin/element-view';
import { cynefinToolbarExtension } from './cynefin/toolbar/config';
import { effects } from './effects';
import { EstuarineRendererExtension } from './estuarine/element-renderer';
import { EstuarineInteraction, EstuarineView } from './estuarine/element-view';
import { estuarineToolbarExtension } from './estuarine/toolbar/config';
import {
  cynefinTemplateCategory,
  estuarineTemplateCategory,
} from './templates';
import { cynefinEstuarineSeniorTool } from './toolbar/senior-tool';

export class CynefinEstuarineViewExtension extends ViewExtensionProvider {
  override name = 'affine-cynefin-estuarine-gfx';

  override effect(): void {
    super.effect();
    effects();
    extendTemplateCategory(cynefinTemplateCategory);
    extendTemplateCategory(estuarineTemplateCategory);
  }

  override setup(context: ViewExtensionContext) {
    super.setup(context);
    context.register(CynefinView);
    context.register(CynefinRendererExtension);
    context.register(EstuarineView);
    context.register(EstuarineRendererExtension);
    if (this.isEdgeless(context.scope)) {
      context.register(CynefinInteraction);
      context.register(EstuarineInteraction);
      context.register(cynefinEstuarineSeniorTool);
      context.register(cynefinToolbarExtension);
      context.register(estuarineToolbarExtension);
    }
  }
}
