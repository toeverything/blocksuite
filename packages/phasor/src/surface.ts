import { assertExists } from '@blocksuite/global/utils';
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';
import { randomSeed } from 'roughjs/bin/math.js';
import * as Y from 'yjs';

import type { IBound } from './consts.js';
import {
  type ElementCreateProps,
  ElementCtors,
  ElementDefaultProps,
  type IPhasorElementType,
  type PhasorElement,
  type PhasorElementType,
  type SurfaceElement,
} from './elements/index.js';
import type {
  HitTestOptions,
  TransformPropertyValue,
} from './elements/surface-element.js';
import { compare } from './grid.js';
import { ConnectorElement, intersects } from './index.js';
import type { SurfaceViewport } from './renderer.js';
import { Renderer } from './renderer.js';
import { contains, getCommonBound } from './utils/bound.js';
import { generateElementId } from './utils/std.js';
import { serializeXYWH } from './utils/xywh.js';

export class SurfaceManager {
  private _renderer: Renderer;
  private _yContainer: Y.Map<Y.Map<unknown>>;
  private _elements = new Map<string, SurfaceElement>();
  private _bindings = new Map<string, Set<string>>();
  private _lastIndex = 'a0';

  private _transformPropertyValue: TransformPropertyValue;

  constructor(
    yContainer: Y.Map<unknown>,
    transformPropertyValue: TransformPropertyValue = v => v
  ) {
    this._renderer = new Renderer();
    this._yContainer = yContainer as Y.Map<Y.Map<unknown>>;
    this._transformPropertyValue = transformPropertyValue;

    this._syncFromExistingContainer();
    this._yContainer.observe(this._onYContainer);
  }

  get viewport(): SurfaceViewport {
    return this._renderer;
  }

  attach(container: HTMLElement) {
    this._renderer.attach(container);
  }

  onResize() {
    this._renderer.onResize();
  }

  getElementsBound(): IBound | null {
    return getCommonBound([...this._elements.values()]);
  }

  addElement<T extends keyof IPhasorElementType>(
    type: T,
    properties: ElementCreateProps<T>
  ): PhasorElement['id'] {
    const id = generateElementId();

    const yMap = new Y.Map();

    const defaultProps = ElementDefaultProps[type];
    const props: ElementCreateProps<T> = {
      ...defaultProps,
      ...properties,
      id,
      index: generateKeyBetween(this._lastIndex, null),
      seed: randomSeed(),
    };
    for (const key in props) {
      yMap.set(key, props[key as keyof ElementCreateProps<T>]);
    }

    this._yContainer.set(id, yMap);

    return id;
  }

  updateElement<T extends keyof IPhasorElementType>(
    id: string,
    properties: ElementCreateProps<T>
  ) {
    const element = this._elements.get(id);
    assertExists(element);
    element.applyUpdate(properties);
  }

  setElementBound(id: string, bound: IBound) {
    this.updateElement(id, {
      xywh: serializeXYWH(bound.x, bound.y, bound.w, bound.h),
    });
  }

  removeElement(id: string) {
    this._transact(() => {
      this._yContainer.delete(id);
    });
  }

  hasElement(id: string) {
    return this._yContainer.has(id);
  }

  toModelCoord(viewX: number, viewY: number): [number, number] {
    return this._renderer.toModelCoord(viewX, viewY);
  }

  toViewCoord(modelX: number, modelY: number): [number, number] {
    return this._renderer.toViewCoord(modelX, modelY);
  }

  pickById(id: string) {
    return this._elements.get(id);
  }

  pickByPoint(
    x: number,
    y: number,
    options?: HitTestOptions
  ): SurfaceElement[] {
    const bound: IBound = { x: x - 1, y: y - 1, w: 2, h: 2 };
    const candidates = this._renderer.gridManager.search(bound);
    const picked = candidates.filter(element => {
      return element.hitTest(x, y, options);
    });

    return picked;
  }

  pickTop(x: number, y: number): SurfaceElement | null {
    const results = this.pickByPoint(x, y);
    return results[results.length - 1] ?? null;
  }

  pickByBound(bound: IBound): SurfaceElement[] {
    const candidates = this._renderer.gridManager.search(bound);
    const picked = candidates.filter((element: SurfaceElement) => {
      return contains(bound, element) || intersects(bound, element);
    });

    return picked;
  }

  /**
   * Generates a bound by elements.
   */
  genBound(elements: SurfaceElement[]): IBound {
    const bound = {
      x: 0,
      y: 0,
      w: 0,
      h: 0,
    };

    let i = 0;
    const l = elements.length;
    const first = elements[i];

    if (l) {
      bound.x = first.x;
      bound.y = first.y;
      bound.w = first.w;
      bound.h = first.h;

      let e;
      let maxX;
      let maxY;
      for (i++; i < l; i++) {
        e = elements[i];
        bound.x = Math.min(bound.x, e.x);
        bound.y = Math.min(bound.y, e.y);
        maxX = Math.max(bound.x + bound.w, e.x + e.w);
        maxY = Math.max(bound.y + bound.h, e.y + e.h);
        bound.w = maxX - bound.x;
        bound.h = maxY - bound.y;
      }
    }

    return bound;
  }

  bringToFront(elementIds: string[]) {
    if (!elementIds.length) {
      return;
    }

    const sortedElements = (
      elementIds
        .map(id => this._elements.get(id))
        .filter(e => !!e) as SurfaceElement[]
    ).sort(compare);

    const bound = this.genBound(sortedElements);
    const elements = this.pickByBound(bound).sort(compare);
    const startIndex = elements[0].index;
    const indexes = sortedElements.map(e =>
      elements.findIndex(element => element === e)
    );

    let curr;
    let start = indexes[0];
    let end = indexes[0];
    const ranges = [[start, end]];
    const len = indexes.length;
    for (let i = 1; i < len; i++) {
      curr = indexes[i];
      if (curr - end === 1) {
        ranges[i - 1][1] = end = curr;
      } else {
        ranges.push([start, end]);
        start = curr;
      }
    }

    ranges.forEach(([start, end]) => {
      const temp = elements.splice(start, end + 1 - start);
      elements.push(...temp);
    });

    const keys = generateNKeysBetween(startIndex, null, elements.length);

    this._transact(() => {
      elements.forEach((ele, index) => {
        const yElement = this._yContainer.get(ele.id) as Y.Map<unknown>;
        yElement.set('index', keys[index]);
      });
    });
  }

  bringForward(elementIds: string[]) {
    if (!elementIds.length) {
      return;
    }

    const sortedElements = (
      elementIds
        .map(id => this._elements.get(id))
        .filter(e => !!e) as SurfaceElement[]
    ).sort(compare);

    const bound = this.genBound(sortedElements);
    const elements = this.pickByBound(bound).sort(compare);
    const startIndex = elements[0].index;
    const indexes = sortedElements.map(e =>
      elements.findIndex(element => element === e)
    );

    let curr;
    let start = indexes[0];
    let end = indexes[0];
    const ranges = [[start, end]];
    const len = indexes.length;
    for (let i = 1; i < len; i++) {
      curr = indexes[i];
      if (curr - end === 1) {
        ranges[i - 1][1] = end = curr;
      } else {
        ranges.push([start, end]);
        start = curr;
      }
    }

    ranges.forEach(([start, end]) => {
      const temp = elements.splice(start, end + 1 - start);
      elements.splice(end + 1, 0, ...temp);
    });

    const keys = generateNKeysBetween(startIndex, null, elements.length);

    this._transact(() => {
      elements.forEach((ele, index) => {
        const yElement = this._yContainer.get(ele.id) as Y.Map<unknown>;
        yElement.set('index', keys[index]);
      });
    });
  }

  sendBackward(elementIds: string[]) {
    if (!elementIds.length) {
      return;
    }

    const sortedElements = (
      elementIds
        .map(id => this._elements.get(id))
        .filter(e => !!e) as SurfaceElement[]
    ).sort(compare);

    const bound = this.genBound(sortedElements);
    const elements = this.pickByBound(bound).sort(compare);
    const lastIndex = elements[elements.length - 1].index;
    const indexes = sortedElements.map(e =>
      elements.findIndex(element => element === e)
    );

    let curr;
    let start = indexes[0];
    let end = indexes[0];
    const ranges = [[start, end]];
    const len = indexes.length;
    for (let i = 1; i < len; i++) {
      curr = indexes[i];
      if (curr - end === 1) {
        ranges[i - 1][1] = end = curr;
      } else {
        ranges.push([start, end]);
        start = curr;
      }
    }

    ranges.forEach(([start, end]) => {
      const temp = elements.splice(start, end + 1 - start);
      elements.splice(start - 1, 0, ...temp);
    });

    const keys = generateNKeysBetween(null, lastIndex, elements.length);

    this._transact(() => {
      elements.forEach((ele, index) => {
        const yElement = this._yContainer.get(ele.id) as Y.Map<unknown>;
        yElement.set('index', keys[index]);
      });
    });
  }

  sendToBack(elementIds: string[]) {
    if (!elementIds.length) {
      return;
    }

    const sortedElements = (
      elementIds
        .map(id => this._elements.get(id))
        .filter(e => !!e) as SurfaceElement[]
    ).sort(compare);

    const bound = this.genBound(sortedElements);
    const elements = this.pickByBound(bound).sort(compare);
    const lastIndex = elements[elements.length - 1].index;
    const indexes = sortedElements.map(e =>
      elements.findIndex(element => element === e)
    );

    let curr;
    let start = indexes[0];
    let end = indexes[0];
    const ranges = [[start, end]];
    const len = indexes.length;
    for (let i = 1; i < len; i++) {
      curr = indexes[i];
      if (curr - end === 1) {
        ranges[i - 1][1] = end = curr;
      } else {
        ranges.push([start, end]);
        start = curr;
      }
    }

    ranges.reverse().forEach(([start, end]) => {
      const temp = elements.splice(start, end + 1 - start);
      elements.unshift(...temp);
    });

    const keys = generateNKeysBetween(null, lastIndex, elements.length);

    this._transact(() => {
      elements.forEach((ele, index) => {
        const yElement = this._yContainer.get(ele.id) as Y.Map<unknown>;
        yElement.set('index', keys[index]);
      });
    });
  }

  getBindingElements(id: string) {
    const bindingIds = this._bindings.get(id);
    if (!bindingIds?.size) {
      return [];
    }
    return [...bindingIds.values()]
      .map(bindingId => this.pickById(bindingId))
      .filter(e => !!e) as SurfaceElement[];
  }

  private _addBinding(id0: string, id1: string) {
    if (!this._bindings.has(id0)) {
      this._bindings.set(id0, new Set());
    }
    this._bindings.get(id0)?.add(id1);
  }

  private _updateBindings(element: SurfaceElement) {
    if (element instanceof ConnectorElement) {
      if (element.startElement) {
        this._addBinding(element.startElement.id, element.id);
        this._addBinding(element.id, element.startElement.id);
      }
      if (element.endElement) {
        this._addBinding(element.endElement.id, element.id);
        this._addBinding(element.id, element.endElement.id);
      }
    }
  }

  private _syncFromExistingContainer() {
    this._yContainer.forEach(yElement => {
      const type = yElement.get('type') as keyof PhasorElementType;

      const ElementCtor = ElementCtors[type];
      assertExists(ElementCtor);
      const element = new ElementCtor(yElement);
      element.transformPropertyValue = this._transformPropertyValue;
      element.mount(this._renderer);

      this._elements.set(element.id, element);

      if (element.index > this._lastIndex) {
        this._lastIndex = element.index;
      }

      this._updateBindings(element);
    });
  }

  private _onYContainer = (event: Y.YMapEvent<Y.Map<unknown>>) => {
    // skip empty event
    if (event.changes.keys.size === 0) return;
    event.keysChanged.forEach(id => {
      const type = event.changes.keys.get(id);
      if (!type) {
        console.error('invalid event', event);
        return;
      }

      if (type.action === 'add') {
        const yElement = this._yContainer.get(id) as Y.Map<unknown>;
        const type = yElement.get('type') as keyof PhasorElementType;

        const ElementCtor = ElementCtors[type];
        assertExists(ElementCtor);
        const element = new ElementCtor(yElement);
        element.transformPropertyValue = this._transformPropertyValue;
        element.mount(this._renderer);

        this._elements.set(element.id, element);

        if (element.index > this._lastIndex) {
          this._lastIndex = element.index;
        }

        this._updateBindings(element);
      } else if (type.action === 'update') {
        console.error('update event on yElements is not supported', event);
      } else if (type.action === 'delete') {
        const element = this._elements.get(id);
        assertExists(element);
        element.unmount();
        this._elements.delete(id);
      }
    });
  };

  private _transact(callback: () => void) {
    const doc = this._yContainer.doc as Y.Doc;
    doc.transact(callback, doc.clientID);
  }

  dispose() {
    this._yContainer.unobserve(this._onYContainer);
  }

  /** @internal Only for testing */
  initDefaultGestureHandler() {
    const { _renderer } = this;
    _renderer.canvas.addEventListener('wheel', e => {
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
