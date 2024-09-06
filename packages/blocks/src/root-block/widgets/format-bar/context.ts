import type { AffineFormatBarWidget } from './format-bar.js';

import { MenuContext } from '../../configs/toolbar.js';

export class FormatBarContext extends MenuContext {
  get doc() {
    return this.toolbar.host.doc;
  }

  get host() {
    return this.toolbar.host;
  }

  get selectedBlockModels() {
    const [success, result] = this.std.command
      .chain()
      .tryAll(chain => [
        chain.getTextSelection(),
        chain.getBlockSelections(),
        chain.getImageSelections(),
      ])
      .getSelectedModels({
        mode: 'highest',
      })
      .run();

    if (!success) {
      return [];
    }

    // should return an empty array if `to` of the range is null
    if (
      result.currentTextSelection &&
      !result.currentTextSelection.to &&
      result.currentTextSelection.from.length === 0
    ) {
      return [];
    }

    if (result.selectedModels?.length) {
      return result.selectedModels;
    }

    return [];
  }

  get std() {
    return this.toolbar.std;
  }

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
}
