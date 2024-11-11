import type { Doc } from '@blocksuite/store';

import { SurfaceRefBlockSchema } from '@blocksuite/affine-model';
import { BlockService } from '@blocksuite/block-std';

import type { SurfaceRefBlockComponent } from './surface-ref-block.js';

import { SurfaceRefRenderer } from './surface-ref-renderer.js';

export class SurfaceRefBlockService extends BlockService {
  static override readonly flavour = SurfaceRefBlockSchema.model.flavour;

  private _rendererMap = new Map<string, SurfaceRefRenderer>();

  getRenderer(
    surfaceRefBlockComponent: SurfaceRefBlockComponent,
    id: string,
    doc: Doc = this.doc,
    stackingCanvas = false
  ) {
    if (this._rendererMap.has(id)) {
      return this._rendererMap.get(id)!;
    }
    const renderer = new SurfaceRefRenderer(id, doc, this.std, {
      enableStackingCanvas: stackingCanvas,
    });
    renderer.viewport.setViewportElm(surfaceRefBlockComponent);
    this._rendererMap.set(id, renderer);
    return renderer;
  }

  removeRenderer(id: string) {
    const renderer = this._rendererMap.get(id);
    if (renderer) {
      renderer.unmount();
      this._rendererMap.delete(id);
    }
  }
}
