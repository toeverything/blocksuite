import {
  type GfxController,
  GfxControllerIdentifier,
} from '@blocksuite/block-std/gfx';
import { type Container, createIdentifier } from '@blocksuite/global/di';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { assertType, type Constructor } from '@blocksuite/global/utils';

import type { RoughCanvas } from '../utils/rough/canvas.js';
import type { CanvasRenderer } from './canvas-renderer.js';

/**
 * An overlay is a layer covered on top of elements,
 * can be used for rendering non-CRDT state indicators.
 */
export abstract class Overlay {
  static overlayName: string = '';

  protected _renderer: CanvasRenderer | null = null;

  constructor(protected gfx: GfxController) {}

  clear() {}

  abstract render(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void;

  setRenderer(renderer: CanvasRenderer | null) {
    this._renderer = renderer;
  }
}

export const OverlayIdentifier = createIdentifier<Overlay>('Overlay');

export function OverlayExtension(overlays: Constructor<Overlay>[]) {
  return {
    setup: (di: Container) => {
      overlays.forEach(Ctor => {
        assertType<typeof Overlay>(Ctor);
        if (!Ctor.overlayName) {
          throw new BlockSuiteError(
            ErrorCode.ValueNotExists,
            'The `overlayName` is not defined on the Overlay.'
          );
        }

        di.addImpl(OverlayIdentifier(Ctor.overlayName), Ctor, [
          GfxControllerIdentifier,
        ]);
      });
    },
  };
}
