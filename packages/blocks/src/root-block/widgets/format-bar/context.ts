import type { AffineFormatBarWidget } from './format-bar.js';

import { MenuContext } from '../../configs/toolbar.js';

export class FormatBarContext extends MenuContext {
  constructor(public toolbar: AffineFormatBarWidget) {
    super();
  }

  isEmpty() {
    return this.selectedBlockModels.length === 0;
  }

  isMultiple() {
    return this.selectedBlockModels.length > 1;
  }

  isSingle() {
    return this.selectedBlockModels.length === 1;
  }

  get doc() {
    return this.toolbar.host.doc;
  }

  get host() {
    return this.toolbar.host;
  }

  get selectedBlockModels() {
    const { success, selectedModels } =
      this.std.command.exec('getSelectedModels');

    if (!success) return [];

    return selectedModels ?? [];
  }

  get std() {
    return this.toolbar.std;
  }
}
