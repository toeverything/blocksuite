import type * as Y from 'yjs';
import type { Element } from './elements.js';
import { Renderer } from './renderer.js';

export class SurfaceContainer {
  readonly renderer: Renderer;
  private _yContainer: Y.Map<unknown>;

  constructor(canvas: HTMLCanvasElement, yContainer: Y.Map<unknown>) {
    this.renderer = new Renderer(canvas);
    this._yContainer = yContainer;
  }

  get debugElements() {
    return this._yContainer.toJSON();
  }

  addElement(element: Element) {
    this.renderer.load([element]);
  }
}
