import { BlockService } from '@blocksuite/block-std';
import { type Page, Slot } from '@blocksuite/store';

import { SurfaceRefRenderer } from './surface-ref-renderer.js';

export class SurfaceRefBlockService extends BlockService {
  static editorModeSwitch = new Slot<'edgeless' | 'page'>();

  private _rendererMap = new Map<string, SurfaceRefRenderer>();

  getRenderer(id: string, page: Page = this.page, stackingCanvas = false) {
    if (this._rendererMap.has(id)) {
      return this._rendererMap.get(id)!;
    }
    const renderer = new SurfaceRefRenderer(id, page, this.std, {
      enableStackingCanvas: stackingCanvas,
    });
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
