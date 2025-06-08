import { OverlayIdentifier } from '@blocksuite/affine-block-surface';
import { MindmapElementModel } from '@blocksuite/affine-model';
import { Bound } from '@blocksuite/global/gfx';
import {
  type DragExtensionInitializeContext,
  type ExtensionDragMoveContext,
  type GfxModel,
  InteractivityExtension,
} from '@blocksuite/std/gfx';

import type { SnapOverlay } from './snap-overlay';

export class SnapExtension extends InteractivityExtension {
  static override key = 'snap-manager';

  get snapOverlay() {
    return this.std.getOptional(
      OverlayIdentifier('snap-manager')
    ) as SnapOverlay;
  }

  override mounted(): void {
    this.action.onDragInitialize(
      (initContext: DragExtensionInitializeContext) => {
        const snapOverlay = this.snapOverlay;

        if (!snapOverlay) {
          return {};
        }

        let alignBound: Bound | null = null;

        return {
          onDragStart() {
            alignBound = snapOverlay.setMovingElements(
              initContext.elements,
              initContext.elements.reduce((pre, elem) => {
                if (elem.group instanceof MindmapElementModel) {
                  pre.push(elem.group);
                }

                return pre;
              }, [] as GfxModel[])
            );
          },
          onDragMove(context: ExtensionDragMoveContext) {
            if (
              context.elements.length === 0 ||
              !alignBound ||
              alignBound.w === 0 ||
              alignBound.h === 0
            ) {
              return;
            }

            const currentBound = alignBound.moveDelta(context.dx, context.dy);
            const alignRst = snapOverlay.align(currentBound);

            context.dx = alignRst.dx + context.dx;
            context.dy = alignRst.dy + context.dy;
          },
          clear() {
            alignBound = null;
            snapOverlay.clear();
          },
        };
      }
    );

    this.action.onElementResize(() => {
      const snapOverlay = this.snapOverlay;

      if (!snapOverlay) {
        return {};
      }

      let alignBound: Bound | null = null;

      return {
        onResizeStart(context) {
          alignBound = snapOverlay.setMovingElements(context.elements);
        },
        onResizeMove(context) {
          if (!alignBound || alignBound.w === 0 || alignBound.h === 0) {
            return;
          }

          const { handle, handleSign, lockRatio } = context;
          let { dx, dy } = context;

          if (lockRatio) {
            const min = Math.min(
              Math.abs(dx / alignBound.w),
              Math.abs(dy / alignBound.h)
            );

            dx = min * Math.sign(dx) * alignBound.w;
            dy = min * Math.sign(dy) * alignBound.h;
          }

          const currentBound = new Bound(
            alignBound.x +
              (handle.includes('left') ? -dx * handleSign.xSign : 0),
            alignBound.y +
              (handle.includes('top') ? -dy * handleSign.ySign : 0),
            Math.abs(alignBound.w + dx * handleSign.xSign),
            Math.abs(alignBound.h + dy * handleSign.ySign)
          );
          const alignRst = snapOverlay.align(currentBound);

          context.suggest({
            dx: alignRst.dx + context.dx,
            dy: alignRst.dy + context.dy,
          });
        },
        onResizeEnd() {
          alignBound = null;
          snapOverlay.clear();
        },
      };
    });
  }
}
