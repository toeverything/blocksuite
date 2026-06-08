import type { WardleyBackgroundElementModel } from '@blocksuite/affine-model';
import {
  GfxElementModelView,
  GfxViewInteractionExtension,
} from '@blocksuite/std/gfx';

export class WardleyView extends GfxElementModelView<WardleyBackgroundElementModel> {
  static override type: string = 'wardley';
}

/**
 * Resize gating: the resize handles are hidden unless `model.resizeEnabled` is
 * true. `beforeResize` is re-evaluated every time the allowed handles are
 * computed (manager.ts), so toggling the field from the toolbar updates the
 * handles reactively. Moving/selecting stays available throughout.
 */
export const WardleyInteraction = GfxViewInteractionExtension<WardleyView>(
  WardleyView.type,
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
