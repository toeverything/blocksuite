import * as Y from 'yjs';
import { generateKeyBetween } from 'fractional-indexing';
import type { IBound } from './consts.js';
import {
  Element,
  ElementType,
  DebugElement,
  ShapeElement,
  ShapeType,
} from './elements/index.js';
import { Renderer } from './renderer.js';
import { assertExists } from '@blocksuite/global/utils';
import { nanoid } from 'nanoid';

export class SurfaceContainer {
  readonly renderer: Renderer;
  private _yElements: Y.Map<Y.Map<unknown>>;
  private _elements = new Map<string, Element>();
  private _lastIndex = 'a0';

  constructor(canvas: HTMLCanvasElement, yContainer: Y.Map<unknown>) {
    this.renderer = new Renderer(canvas);
    this._yElements = yContainer as Y.Map<Y.Map<unknown>>;

    this._syncFromExistingContainer();
    this._yElements.observeDeep(this._handleYEvents);
  }

  addShapeElement(bound: IBound, shapeType: ShapeType, color: string) {
    const id = nanoid(10);
    const element = new ShapeElement(id, shapeType);
    const { x, y, w, h } = bound;

    element.setBound(x, y, w, h);
    element.color = color as `#${string}`;

    return this._addElement(element);
  }

  addDebugElement(bound: IBound, color: string): string {
    const id = nanoid(10);
    const element = new DebugElement(id);
    const { x, y, w, h } = bound;

    element.setBound(x, y, w, h);
    element.color = color;

    return this._addElement(element);
  }

  private _addElement(element: Element) {
    element.index = generateKeyBetween(this._lastIndex, null);
    this._lastIndex = element.index as string;

    this._transact(() => {
      const yElement = this._createYElement(element);
      this._yElements.set(element.id, yElement);
    });

    return element.id;
  }

  setElementBound(id: string, bound: IBound) {
    this._transact(() => {
      const yElement = this._yElements.get(id) as Y.Map<unknown>;
      assertExists(yElement);
      const xywh = `${bound.x},${bound.y},${bound.w},${bound.h}`;
      yElement.set('xywh', xywh);
    });
  }

  removeElement(id: string) {
    this._transact(() => {
      this._yElements.delete(id);
    });
  }

  private _handleYElementAdded(yElement: Y.Map<unknown>) {
    const type = yElement.get('type') as ElementType;

    let element: Element | null = null;
    switch (type) {
      case 'debug': {
        element = DebugElement.deserialize(yElement.toJSON());
        break;
      }
      case 'shape': {
        element = ShapeElement.deserialize(yElement.toJSON());
        break;
      }
    }
    assertExists(element);

    this.renderer.addElement(element);
    this._elements.set(element.id, element);
  }

  private _syncFromExistingContainer() {
    this._yElements.forEach(yElement => this._handleYElementAdded(yElement));
  }

  private _createYElement(element: Omit<Element, 'id'>) {
    const serialized = element.serialize();
    const yElement = new Y.Map<unknown>();
    for (const [key, value] of Object.entries(serialized)) {
      yElement.set(key, value);
    }
    return yElement;
  }

  private _transact(callback: () => void) {
    const doc = this._yElements.doc as Y.Doc;
    doc.transact(callback, doc.clientID);
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
        this._handleYElementAdded(yElement);
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
