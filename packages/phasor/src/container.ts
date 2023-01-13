import * as Y from 'yjs';
import { Element, RectElement, PathElement } from './elements.js';
import { Renderer } from './renderer.js';

export class SurfaceContainer {
  readonly renderer: Renderer;
  private _yContainer: Y.Array<unknown>;

  constructor(canvas: HTMLCanvasElement, yContainer: Y.Array<unknown>) {
    this.renderer = new Renderer(canvas);
    this._yContainer = yContainer;
    this._yContainer.observeDeep(this._handleYEvents);
  }

  private _createYElement(element: Element) {
    const serialized = element.serialize();
    const yElement = new Y.Map<unknown>();
    for (const [key, value] of Object.entries(serialized)) {
      yElement.set(key, value);
    }
    return yElement;
  }

  addElement(element: Element, index: number | null = null) {
    this._yContainer.doc?.transact(() => {
      const yElement = this._createYElement(element);
      if (index === null) {
        this._yContainer.push([yElement]);
      } else {
        this._yContainer.insert(index, [yElement]);
      }
    });
  }

  private _handleEvent(event: Y.YEvent<Y.Array<unknown> | Y.Map<unknown>>) {
    if (event.target === this._yContainer) {
      // event.changes.delta: [{insert:[YMap]}]
      event.changes.delta.forEach(d => {
        if (d.insert && Array.isArray(d.insert)) {
          for (const item of d.insert) {
            const yElement = item as Y.Map<unknown>;
            const type = yElement.get('type') as string;
            switch (type) {
              case 'rect': {
                const element = RectElement.deserialize(yElement.toJSON());
                // FIXME
                this.renderer.addElement(element);
                break;
              }
              case 'path': {
                const element = PathElement.deserialize(yElement.toJSON());
                // FIXME
                this.renderer.addElement(element);
                break;
              }
            }
          }
        }
        if (d.delete !== undefined) {
          // TODO
        }
      });
    } else if (event.target.parent === this._yContainer) {
      // TODO
    }
  }

  private _handleYEvents = (
    events: Y.YEvent<Y.Array<unknown> | Y.Map<unknown>>[]
  ) => {
    for (const event of events) {
      this._handleEvent(event);
    }
  };
}
