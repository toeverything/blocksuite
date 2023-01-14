import * as Y from 'yjs';
import { Element, RectElement, PathElement } from './elements.js';
import { Renderer } from './renderer.js';

export class SurfaceContainer {
  readonly renderer: Renderer;
  private _yElements: Y.Map<Y.Map<unknown>>;
  private _elements = new Map<string, Element>();

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
    this._yElements.doc?.transact(() => {
      const yElement = this._createYElement(props);
      this._yElements.set(props.id, yElement);
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
      }
    });
  }

  private _handleYEvent(event: Y.YEvent<Y.Map<unknown>>) {
    if (!(event instanceof Y.YMapEvent)) return;

    if (event.target === this._yElements) {
      this._handleYElementsEvent(event);
    } else if (event.target.parent === this._yElements) {
      // TODO
    }
  }

  private _handleYEvents = (events: Y.YEvent<Y.Map<unknown>>[]) => {
    for (const event of events) {
      this._handleYEvent(event);
    }
  };
}
