import * as Y from 'yjs';
import { generateKeyBetween } from 'fractional-indexing';
import type { Bound } from './consts.js';
import { Element, RectElement, PathElement } from './elements.js';
import { Renderer } from './renderer.js';

function assertExists<T>(val: T | null | undefined): asserts val is T {
  if (val === null || val === undefined) {
    throw new Error('val does not exist');
  }
}

export class SurfaceContainer {
  readonly renderer: Renderer;
  private _yElements: Y.Map<Y.Map<unknown>>;
  private _elements = new Map<string, Element>();
  private _lastIndex = 'a0';

  constructor(canvas: HTMLCanvasElement, yContainer: Y.Map<unknown>) {
    this.renderer = new Renderer(canvas);
    this._yElements = yContainer as Y.Map<Y.Map<unknown>>;
    this._yElements.observeDeep(this._handleYEvents);
  }

  private _createYElement(element: Element) {
    const serialized = element.serialize();
    const yElement = new Y.Map<unknown>();
    for (const [key, value] of Object.entries(serialized)) {
      yElement.set(key, value);
    }
    return yElement;
  }

  addElement(props: Element) {
    props.index = generateKeyBetween(this._lastIndex, null);
    this._lastIndex = props.index;

    this._yElements.doc?.transact(() => {
      const yElement = this._createYElement(props);
      this._yElements.set(props.id, yElement);
    });
  }

  setElementBound(id: string, bound: Bound) {
    this._yElements.doc?.transact(() => {
      const yElement = this._yElements.get(id) as Y.Map<unknown>;
      assertExists(yElement);
      const xywh = `${bound.x},${bound.y},${bound.w},${bound.h}`;
      yElement.set('xywh', xywh);
    });
  }

  removeElement(id: string) {
    this._yElements.doc?.transact(() => {
      this._yElements.delete(id);
    });
  }

  private _handleYElementsEvent(event: Y.YMapEvent<unknown>) {
    // skip empty event
    if (event.changes.keys.size === 0) return;

    event.keysChanged.forEach(id => {
      const type = event.changes.keys.get(id);
      if (!type) {
        console.error('invalid event', event);
        return;
      }

      if (type.action === 'add') {
        const yElement = this._yElements.get(id) as Y.Map<unknown>;
        const type = yElement.get('type') as string;
        switch (type) {
          case 'rect': {
            const element = RectElement.deserialize(yElement.toJSON());
            this.renderer.addElement(element);
            this._elements.set(element.id, element);
            break;
          }
          case 'path': {
            const element = PathElement.deserialize(yElement.toJSON());
            this.renderer.addElement(element);
            this._elements.set(element.id, element);
            break;
          }
        }
      } else if (type.action === 'update') {
        console.error('update event on yElements is not supported', event);
      } else if (type.action === 'delete') {
        const element = this._elements.get(id);
        assertExists(element);
        this.renderer.removeElement(element);
        this._elements.delete(id);
      }
    });
  }

  private _handleYElementEvent(event: Y.YMapEvent<unknown>) {
    const yElement = event.target as Y.Map<unknown>;
    const id = yElement.get('id') as string;

    event.keysChanged.forEach(key => {
      const type = event.changes.keys.get(key);
      if (!type) {
        console.error('invalid event', event);
        return;
      }

      if (type.action === 'update') {
        const element = this._elements.get(id);
        assertExists(element);

        if (key === 'xywh') {
          const xywh = yElement.get(key) as string;
          const [x, y, w, h] = xywh.split(',').map(Number);

          // refresh grid manager
          this.renderer.removeElement(element);
          element.setBound(x, y, w, h);
          this.renderer.addElement(element);
        }
      }
    });
  }

  private _handleYEvent(event: Y.YEvent<Y.Map<unknown>>) {
    if (!(event instanceof Y.YMapEvent)) return;

    if (event.target === this._yElements) {
      this._handleYElementsEvent(event);
    } else if (event.target.parent === this._yElements) {
      this._handleYElementEvent(event);
    }
  }

  private _handleYEvents = (events: Y.YEvent<Y.Map<unknown>>[]) => {
    for (const event of events) {
      this._handleYEvent(event);
    }
  };
}
