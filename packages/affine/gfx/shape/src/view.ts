import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/affine-ext-loader';

import { effects } from './effects';
import {
  HighlighterElementRendererExtension,
  ShapeElementRendererExtension,
} from './element-renderer';
import { ShapeElementView } from './element-view';
import { ShapeTool } from './shape-tool';
import { shapeSeniorTool, shapeToolbarExtension } from './toolbar';

export class ShapeViewExtension extends ViewExtensionProvider {
  override name = 'affine-shape-gfx';

  override effect(): void {
    super.effect();
    effects();
  }

  override setup(context: ViewExtensionContext) {
    super.setup(context);
    if (this.isEdgeless(context.scope)) {
      context.register(HighlighterElementRendererExtension);
      context.register(ShapeElementRendererExtension);
      context.register(ShapeElementView);
      context.register(ShapeTool);
      context.register(shapeSeniorTool);
      context.register(shapeToolbarExtension);
    }
  }
}
