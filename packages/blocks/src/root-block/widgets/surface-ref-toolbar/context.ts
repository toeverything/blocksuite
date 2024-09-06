import type { SurfaceRefBlockComponent } from '../../../surface-ref-block/surface-ref-block.js';

import { MenuContext } from '../../configs/toolbar.js';

export class SurfaceRefToolbarContext extends MenuContext {
  override close = () => {
    this.abortController.abort();
  };

  get doc() {
    return this.blockComponent.doc;
  }

  get host() {
    return this.blockComponent.host;
  }

  get selectedBlockModels() {
    if (this.blockComponent) return [this.blockComponent.model];
    return [];
  }

  get std() {
    return this.host.std;
  }

  constructor(
    public blockComponent: SurfaceRefBlockComponent,
    public abortController: AbortController
  ) {
    super();
  }

  isEmpty() {
    return !this.blockComponent;
  }

  isMultiple() {
    return false;
  }

  isSingle() {
    return true;
  }
}
