import type { EditorHost } from '@blocksuite/block-std';

import { Slot, throttle } from '@blocksuite/global/utils';

import { BLOCK_ID_ATTR } from '../../../_common/consts.js';
import { almostEqual } from '../../../_common/utils/math.js';
import { matchFlavours } from '../../../_common/utils/model.js';
import { buildPath } from '../../../_common/utils/query.js';

export class NoteResizeObserver {
  /**
   * Observation will fire when observation starts if Element is being rendered, and Element’s size is not 0,0.
   * https://w3c.github.io/csswg-drafts/resize-observer/#resize-observer-interface
   *
   * So we need to cache observed element.
   */
  private _cachedElements = new Map<string, Element>();

  private _lastRects = new Map<string, DOMRectReadOnly>();

  private _observer: ResizeObserver;

  private _onResize = (entries: ResizeObserverEntry[]) => {
    const resizedNotes = new Map<string, [DOMRectReadOnly, DOMRectReadOnly?]>();
    entries.forEach(entry => {
      const blockElement = entry.target.closest(`[${BLOCK_ID_ATTR}]`);
      const id = blockElement?.getAttribute(BLOCK_ID_ATTR);
      if (!id) return;
      const lastRect = this._lastRects.get(id);
      if (
        lastRect &&
        almostEqual(lastRect.x, entry.contentRect.x) &&
        almostEqual(lastRect.y, entry.contentRect.y) &&
        almostEqual(lastRect.width, entry.contentRect.width) &&
        almostEqual(lastRect.height, entry.contentRect.height)
      ) {
        return;
      }
      resizedNotes.set(id, [entry.contentRect, lastRect]);
      this._lastRects.set(id, entry.contentRect);
    });

    if (resizedNotes.size) {
      this.slots.resize.emit(resizedNotes);
    }
  };

  slots = {
    resize: new Slot<Map<string, [DOMRectReadOnly, DOMRectReadOnly?]>>(),
  };

  constructor() {
    this._observer = new ResizeObserver(
      throttle<ResizeObserverEntry[][], typeof this._onResize>(
        this._onResize,
        1000 / 60
      )
    );
  }

  dispose() {
    this._observer.disconnect();
    this.slots.resize.dispose();
    this._cachedElements.clear();
    this._lastRects.clear();
  }

  resetListener(editorHost: EditorHost) {
    const doc = editorHost.doc;
    const unCachedKeys = new Set(this._cachedElements.keys());
    doc.root?.children.forEach(model => {
      if (!matchFlavours(model, ['affine:note'])) return;

      const blockId = model.id;
      unCachedKeys.delete(blockId);

      const blockElement = editorHost.view.viewFromPath(
        'block',
        buildPath(model)
      );

      const container = blockElement?.querySelector(
        '.affine-note-block-container'
      );

      const cachedElement = this._cachedElements.get(blockId);
      if (cachedElement) {
        if (container === cachedElement && !model.edgeless.collapse) {
          return;
        }
        this._observer.unobserve(cachedElement);
        this._cachedElements.delete(blockId);
      }

      if (!container || model.edgeless.collapse) return;
      this._lastRects.set(blockId, container.getBoundingClientRect());
      this._observer.observe(container);
      this._cachedElements.set(blockId, container);
    });

    unCachedKeys.forEach(k => {
      const element = this._cachedElements.get(k);
      if (!element) return;
      this._observer.unobserve(element);
    });
  }
}
