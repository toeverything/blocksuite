import type { CynefinElementModel } from '@blocksuite/affine-model';
import {
  GfxElementModelView,
  GfxViewInteractionExtension,
} from '@blocksuite/std/gfx';

/**
 * View for the Cynefin background. Registering it ensures `gfx.view.get(model)`
 * returns a view (required so move / select interactions work).
 */
export class CynefinView extends GfxElementModelView<CynefinElementModel> {
  static override type: string = 'cynefin';
}

/**
 * Resize gating: the resize handles are hidden unless `model.resizeEnabled` is
 * true (toggled from the toolbar). Moving / selecting stays available.
 */
export const CynefinInteraction = GfxViewInteractionExtension<CynefinView>(
  CynefinView.type,
  {
    handleResize({ model }) {
      return {
        beforeResize({ set }) {
          if (!model.resizeEnabled) {
            set({ allowedHandlers: [] });
          }
        },
      };
    },
  }
);
