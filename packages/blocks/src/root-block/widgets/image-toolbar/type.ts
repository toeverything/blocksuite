import type { ImageBlockComponent } from '../../../image-block/image-block.js';

import { MoreMenuContext } from '../../configs/toolbar.js';

export class ImageToolbarContext extends MoreMenuContext {
  constructor(
    public blockComponent: ImageBlockComponent,
    public abortController: AbortController
  ) {
    super();
  }

  override isEmpty() {
    return false;
  }

  get doc() {
    return this.blockComponent.doc;
  }

  get host() {
    return this.blockComponent.host;
  }

  get selectedBlockModels() {
    return [this.blockComponent.model];
  }

  get std() {
    return this.blockComponent.std;
  }
}
