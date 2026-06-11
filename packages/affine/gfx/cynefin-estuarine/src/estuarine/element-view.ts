import type { EstuarineElementModel } from '@labre/affine-model';
import {
  GfxElementModelView,
  GfxViewInteractionExtension,
} from '@labre/std/gfx';

/**
 * View for the Estuarine background. Registering it ensures `gfx.view.get(model)`
 * returns a view (required so move / select interactions work).
 */
export class EstuarineView extends GfxElementModelView<EstuarineElementModel> {
  static override type: string = 'estuarine';
}

/**
 * Resize gating: the resize handles are hidden unless `model.resizeEnabled` is
 * true (toggled from the toolbar). Moving / selecting stays available.
 */
export const EstuarineInteraction = GfxViewInteractionExtension<EstuarineView>(
  EstuarineView.type,
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
