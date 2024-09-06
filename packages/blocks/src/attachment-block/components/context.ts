import type { AttachmentBlockComponent } from '../attachment-block.js';

import { MenuContext } from '../../root-block/configs/toolbar.js';

export class AttachmentToolbarMoreMenuContext extends MenuContext {
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
    if (this.blockComponent.model) return [this.blockComponent.model];
    return [];
  }

  get std() {
    return this.blockComponent.std;
  }

  constructor(
    public blockComponent: AttachmentBlockComponent,
    public abortController: AbortController
  ) {
    super();
  }

  isEmpty() {
    return false;
  }

  isMultiple() {
    return false;
  }

  isSingle() {
    return true;
  }
}
