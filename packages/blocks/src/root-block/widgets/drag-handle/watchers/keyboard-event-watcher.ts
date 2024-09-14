import type { UIEventHandler } from '@blocksuite/block-std';

import type { AffineDragHandleWidget } from '../drag-handle.js';

export class KeyboardEventWatcher {
  private _keyboardHandler: UIEventHandler = ctx => {
    if (!this.widget.dragging || !this.widget.dragPreview) {
      return;
    }

    const state = ctx.get('defaultState');
    const event = state.event as KeyboardEvent;
    event.preventDefault();
    event.stopPropagation();

    const altKey = event.key === 'Alt' && event.altKey;
    this.widget.dragPreview.style.opacity = altKey ? '1' : '0.5';
  };

  constructor(readonly widget: AffineDragHandleWidget) {}

  watch() {
    this.widget.handleEvent('beforeInput', () => this.widget.hide());
    this.widget.handleEvent('keyDown', this._keyboardHandler, { global: true });
    this.widget.handleEvent('keyUp', this._keyboardHandler, { global: true });
  }
}
