import { assertExists } from '@blocksuite/global/utils';
import { randomSeed } from 'roughjs/bin/math.js';
import * as Y from 'yjs';

import type { IBound } from './consts.js';
import {
  ConnectorElement,
  ElementCtors,
  ElementDefaultProps,
  type IElementCreateProps,
  type IPhasorElementType,
  type PhasorElement,
  type PhasorElementType,
  type SurfaceElement,
} from './elements/index.js';
import type {
  ComputedValue,
  HitTestOptions,
} from './elements/surface-element.js';
import { compare } from './grid.js';
import type { SurfaceViewport } from './renderer.js';
import { Renderer } from './renderer.js';
import { contains, getCommonBound } from './utils/bound.js';
import { intersects } from './utils/hit-utils.js';
import {
  generateElementId,
  generateKeyBetween,
  normalizeWheelDeltaY,
} from './utils/std.js';
import { serializeXYWH } from './utils/xywh.js';

export class SurfaceManager {
  // this field will only be null during unit test
  private _renderer: Renderer | null = null;
  private _yContainer: Y.Map<Y.Map<unknown>>;
  private _elements = new Map<string, SurfaceElement>();
  private _bindings = new Map<string, Set<string>>();

  private _computedValue: ComputedValue;

  indexes = { min: 'a0', max: 'a0' };

  constructor(
    yContainer: Y.Map<unknown>,
    computedValue: ComputedValue = v => v
  ) {
    if (import.meta.env.VITE_IS_UNIT_TEST !== 'true') {
      this._renderer = new Renderer();
    }
    this._yContainer = yContainer as Y.Map<Y.Map<unknown>>;
    this._computedValue = computedValue;

    this._syncFromExistingContainer();
    this._yContainer.observe(this._onYContainer);
  }

  get viewport(): SurfaceViewport {
    assertExists(this._renderer);
    return this._renderer;
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
    this._transact(() => {
      this._yContainer.forEach(yElement => {
        assertExists(this._renderer);
        const type = yElement.get('type') as keyof PhasorElementType;

        const ElementCtor = ElementCtors[type];
        assertExists(ElementCtor);
        const element = new ElementCtor(yElement, this);
        element.computedValue = this._computedValue;
        element.mount(this._renderer);

        this._elements.set(element.id, element);

        if (element.index > this.indexes.max) {
          this.indexes.max = element.index;
        } else if (element.index < this.indexes.min) {
          this.indexes.min = element.index;
        }

        this._updateBindings(element);
      });
    });
  }

  private _onYContainer = (event: Y.YMapEvent<Y.Map<unknown>>) => {
    // skip empty event
    if (event.changes.keys.size === 0) return;
    event.keysChanged.forEach(id => {
      assertExists(this._renderer);
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
        const element = new ElementCtor(yElement, this);
        element.computedValue = this._computedValue;
        element.mount(this._renderer);

        this._elements.set(element.id, element);

        if (element.index > this.indexes.max) {
          this.indexes.max = element.index;
        }

        this._updateBindings(element);
      } else if (type.action === 'update') {
        console.error('update event on yElements is not supported', event);
      } else if (type.action === 'delete') {
        const element = this._elements.get(id);
        assertExists(element);
        element.unmount();
        this._elements.delete(id);

        if (element.index === this.indexes.min) {
          this.indexes.min = generateKeyBetween(element.index, null);
        }
      }
    });
  };

  private _transact(callback: () => void) {
    const doc = this._yContainer.doc as Y.Doc;
    doc.transact(callback, doc.clientID);
  }

  refresh() {
    assertExists(this._renderer);
    this._renderer.refresh();
  }

  updateIndexes(
    keys: string[],
    elements: PhasorElement[],
    callback: (keys: string[]) => void
  ) {
    this._transact(() => {
      let newIndex;
      let i = 0;
      const len = elements.length;
      for (; i < len; i++) {
        newIndex = keys[i];
        const yElement = this._yContainer.get(elements[i].id) as Y.Map<unknown>;
        const oldIndex = yElement.get('index') as string;
        if (oldIndex === newIndex) continue;
        yElement.set('index', newIndex);
      }

      callback(keys);
    });
  }

  attach(container: HTMLElement) {
    assertExists(this._renderer);
    this._renderer.attach(container);
  }

  onResize() {
    assertExists(this._renderer);
    this._renderer.onResize();
  }

  getElementsBound(): IBound | null {
    return getCommonBound([...this._elements.values()]);
  }

  addElement<T extends keyof IPhasorElementType>(
    type: T,
    properties: IElementCreateProps<T>
  ): PhasorElement['id'] {
    const id = generateElementId();

    const yMap = new Y.Map();

    const defaultProps = ElementDefaultProps[type];
    const props: IElementCreateProps<T> = {
      ...defaultProps,
      ...properties,
      id,
      index: generateKeyBetween(this.indexes.max, null),
      seed: randomSeed(),
    };

    this._transact(() => {
      for (const [key, value] of Object.entries(props)) {
        if (key === 'text' && !(value instanceof Y.Text)) {
          yMap.set(key, new Y.Text(value));
        } else {
          yMap.set(key, value);
        }
      }
      this._yContainer.set(id, yMap);
    });

    return id;
  }

  updateElement<T extends keyof IPhasorElementType>(
    id: string,
    properties: IElementCreateProps<T>
  ) {
    this._transact(() => {
      const element = this._elements.get(id);
      assertExists(element);
      element.applyUpdate(properties);
    });
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
    assertExists(this._renderer);
    return this._renderer.toModelCoord(viewX, viewY);
  }

  toViewCoord(modelX: number, modelY: number): [number, number] {
    assertExists(this._renderer);
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
    assertExists(this._renderer);
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
    assertExists(this._renderer);
    const candidates = this._renderer.gridManager.search(bound);
    const picked = candidates.filter((element: SurfaceElement) => {
      return contains(bound, element) || intersects(bound, element);
    });

    return picked;
  }

  getSortedElementsWithViewportBounds() {
    return this.pickByBound(this.viewport.viewportBounds).sort(compare);
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

  dispose() {
    this._yContainer.unobserve(this._onYContainer);
  }

  /** @internal Only for testing */
  initDefaultGestureHandler() {
    assertExists(this._renderer);
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
        const zoom = normalizeWheelDeltaY(e.deltaY);
        _renderer.setZoom(zoom);
      }
    });
  }

  getElements() {
    return [...this._elements.values()];
  }
}
