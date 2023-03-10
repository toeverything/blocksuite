import { BLOCK_ID_ATTR } from '@blocksuite/global/config';
import type { Page } from '@blocksuite/store';
import { Slot } from '@blocksuite/store';

import { getBlockElementByModel } from '../../__internal__/utils/query.js';
import { throttle } from '../../__internal__/utils/std.js';

export class FrameResizeObserver {
  private _observer: ResizeObserver;
  /**
   * Observation will fire when observation starts if Element is being rendered, and Element’s size is not 0,0.
   * https://w3c.github.io/csswg-drafts/resize-observer/#resize-observer-interface
   *
   * So we need to cache observed element.
   */
  private _cachedElements = new Map<string, Element>();

  slots = {
    resize: new Slot<Map<string, DOMRect>>(),
  };

  constructor() {
    this._observer = new ResizeObserver(
      throttle<ResizeObserverEntry[][], typeof this._onResize>(
        this._onResize,
        100
      )
    );
  }

  private _onResize = (entries: ResizeObserverEntry[]) => {
    const resizedFrames = new Map<string, DOMRect>();

    entries.forEach(entry => {
      const blockElement = entry.target.closest(`[${BLOCK_ID_ATTR}]`);
      const id = blockElement?.getAttribute(BLOCK_ID_ATTR);
      if (!id) return;
      resizedFrames.set(id, entry.contentRect);
    });

    if (resizedFrames.size) {
      this.slots.resize.emit(resizedFrames);
    }
  };

  resetListener(page: Page) {
    const unCachedKeys = new Set(this._cachedElements.keys());

    page.root?.children.forEach(model => {
      const blockId = model.id;
      unCachedKeys.delete(blockId);
      const blockElement = getBlockElementByModel(model);
      const container = blockElement?.querySelector(
        '.affine-frame-block-container'
      );

      const cachedElement = this._cachedElements.get(blockId);
      if (cachedElement) {
        if (container === cachedElement) {
          return;
        }
        this._observer.unobserve(cachedElement);
        this._cachedElements.delete(blockId);
      }

      if (!container) return;
      this._observer.observe(container);
      this._cachedElements.set(blockId, container);
    });

    unCachedKeys.forEach(k => {
      const element = this._cachedElements.get(k);
      if (!element) return;
      this._observer.unobserve(element);
    });
  }

  dispose() {
    this._observer.disconnect();
    this.slots.resize.dispose();
  }
}
