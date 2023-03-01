import { assertExists } from '@blocksuite/global/utils';
import { generateKeyBetween } from 'fractional-indexing';
import { nanoid } from 'nanoid';
import * as Y from 'yjs';

import type { IBound } from './consts.js';
import type { HitTestOptions } from './elements/base-element.js';
import type { ShapeProps } from './elements/index.js';
import {
  BrushElement,
  DebugElement,
  getBrushBoundFromPoints,
  PhasorElement,
  PhasorElementType,
  ShapeElement,
  ShapeType,
} from './elements/index.js';
import { Renderer } from './renderer.js';
import { deserializeXYWH, serializeXYWH } from './utils/xywh.js';

export class SurfaceManager {
  private _renderer: Renderer;
  private _yElements: Y.Map<Y.Map<unknown>>;
  private _elements = new Map<string, PhasorElement>();
  private _lastIndex = 'a0';

  constructor(canvas: HTMLCanvasElement, yContainer: Y.Map<unknown>) {
    this._renderer = new Renderer(canvas);
    this._yElements = yContainer as Y.Map<Y.Map<unknown>>;

    this._syncFromExistingContainer();
    this._yElements.observeDeep(this._handleYEvents);
  }

  /** @deprecated escape hatch for full traversal of elements */
  get elements() {
    return this._elements.values();
  }

  addShapeElement(bound: IBound, shapeType: ShapeType, props?: ShapeProps) {
    const id = nanoid(10);
    const element = new ShapeElement(id, shapeType);
    const { x, y, w, h } = bound;

    element.setBound(x, y, w, h);
    if (props) {
      element.updateProps(props);
    }

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

  addBrushElement(
    x: number,
    y: number,
    color: string,
    points: number[][] = []
  ): string {
    const id = nanoid(10);
    const element = new BrushElement(id);

    const lineWidth = element.lineWidth;
    const bound = getBrushBoundFromPoints(points, lineWidth);

    element.setBound(x, y, bound.w, bound.h);
    element.color = color;
    element.points = points;

    return this._addElement(element);
  }

  updateBrushElementPoints(id: string, points: number[][]) {
    const yElement = this._yElements.get(id) as Y.Map<unknown>;
    assertExists(yElement);
    yElement.set('points', JSON.stringify(points));
  }

  setElementBound(id: string, bound: IBound) {
    this._transact(() => {
      const yElement = this._yElements.get(id) as Y.Map<unknown>;
      assertExists(yElement);
      const xywh = serializeXYWH(bound.x, bound.y, bound.w, bound.h);
      yElement.set('xywh', xywh);
    });
  }

  removeElement(id: string) {
    this._transact(() => {
      this._yElements.delete(id);
    });
  }

  toModelCoord(viewX: number, viewY: number): [number, number] {
    return this._renderer.toModelCoord(viewX, viewY);
  }

  toViewCoord(modelX: number, modelY: number): [number, number] {
    return this._renderer.toViewCoord(modelX, modelY);
  }

  setViewport(centerX: number, centerY: number, zoom: number) {
    this._renderer.setViewport(centerX, centerY, zoom);
  }

  pick(x: number, y: number, options?: HitTestOptions): PhasorElement[] {
    const bound: IBound = { x: x - 1, y: y - 1, w: 2, h: 2 };
    const candidates = this._renderer.gridManager.search(bound);
    const picked = candidates.filter((element: PhasorElement) => {
      return element.hitTest(x, y, options);
    });

    return picked;
  }

  pickTop(x: number, y: number): PhasorElement | null {
    const results = this.pick(x, y);
    return results[results.length - 1] ?? null;
  }

  addElements(elements: PhasorElement[]) {
    elements.forEach(element => this._addElement(element));
  }

  private _handleYElementAdded(yElement: Y.Map<unknown>) {
    const type = yElement.get('type') as PhasorElementType;

    let element: PhasorElement | null = null;
    switch (type) {
      case 'debug': {
        element = DebugElement.deserialize(yElement.toJSON());
        break;
      }
      case 'shape': {
        element = ShapeElement.deserialize(yElement.toJSON());
        break;
      }
      case 'brush': {
        element = BrushElement.deserialize(yElement.toJSON());
        break;
      }
      default:
        throw new Error('no element type matched.');
    }
    assertExists(element);

    this._renderer.addElement(element);
    this._elements.set(element.id, element);
  }

  private _syncFromExistingContainer() {
    this._yElements.forEach(yElement => this._handleYElementAdded(yElement));
  }

  private _addElement(element: PhasorElement) {
    element.index = generateKeyBetween(this._lastIndex, null);
    this._lastIndex = element.index as string;

    this._transact(() => {
      const yElement = this._createYElement(element);
      this._yElements.set(element.id, yElement);
    });

    return element.id;
  }

  private _createYElement(element: Omit<PhasorElement, 'id'>) {
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
        this._renderer.removeElement(element);
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
          const [x, y, w, h] = deserializeXYWH(xywh);

          // refresh grid manager
          this._renderer.removeElement(element);
          element.setBound(x, y, w, h);
          this._renderer.addElement(element);
        }

        if (key === 'points') {
          const points: number[][] = JSON.parse(yElement.get(key) as string);

          const lineWidth = (element as BrushElement).lineWidth;

          const bounds = getBrushBoundFromPoints(points, lineWidth);

          this._renderer.removeElement(element);
          (element as BrushElement).points = points;
          element.setBound(element.x, element.y, bounds.w, bounds.h);
          this._renderer.addElement(element);
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

  dispose() {
    this._yElements.unobserveDeep(this._handleYEvents);
    this._renderer.dispose();
  }

  /** @internal Only for testing */
  initDefaultGestureHandler() {
    const { _renderer } = this;
    const mouseRoot = _renderer.canvas;
    mouseRoot.addEventListener('wheel', e => {
      e.preventDefault();
      // pan
      if (!e.ctrlKey) {
        const dx = e.deltaX / _renderer.zoom;
        const dy = e.deltaY / _renderer.zoom;
        _renderer.setCenter(_renderer.centerX + dx, _renderer.centerY + dy);
      }
      // zoom
      else {
        const delta = e.deltaX !== 0 ? -e.deltaX : -e.deltaY;
        _renderer.applyDeltaZoom(delta);
      }
    });
  }
}
