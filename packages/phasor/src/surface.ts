import { assertExists, Slot } from '@blocksuite/global/utils';
import * as Y from 'yjs';

import type { IBound } from './consts.js';
import {
  ElementCtors,
  ElementDefaultProps,
  type IElementCreateProps,
  type IElementUpdateProps,
  type IPhasorElementType,
  type PhasorElement,
  type PhasorElementType,
} from './elements/index.js';
import type {
  ComputedValue,
  HitTestOptions,
  SurfaceElement,
} from './elements/surface-element.js';
import { compare } from './grid.js';
import type { SurfaceViewport } from './renderer.js';
import { Renderer } from './renderer.js';
import { randomSeed } from './rough/math.js';
import { Bound, getCommonBound } from './utils/bound.js';
import {
  generateElementId,
  generateKeyBetween,
  normalizeWheelDeltaY,
} from './utils/std.js';
import { serializeXYWH } from './utils/xywh.js';

type id = string;

export interface ElementLocalRecords {
  display: boolean;
  opacity: number;
}

export class SurfaceManager {
  private _renderer: Renderer;
  private _yContainer: Y.Map<Y.Map<unknown>>;
  private _elements = new Map<id, SurfaceElement>();
  private _elementLocalRecords = new Map<id, ElementLocalRecords>();

  private _computedValue: ComputedValue;

  indexes = { min: 'a0', max: 'a0' };
  slots = {
    elementUpdated: new Slot<{
      id: id;
      props:
        | IElementUpdateProps<'shape'>
        | IElementUpdateProps<'connector'>
        | IElementUpdateProps<'brush'>
        | IElementUpdateProps<'shape'>;
    }>(),
    elementAdded: new Slot<id>(),
    elementRemoved: new Slot<id>(),
  };

  constructor(
    yContainer: Y.Map<unknown>,
    computedValue: ComputedValue = v => v
  ) {
    this._renderer = new Renderer();
    this._yContainer = yContainer as Y.Map<Y.Map<unknown>>;
    this._computedValue = computedValue;
    this._yContainer.observe(this._onYContainer);
  }

  init() {
    this._syncFromExistingContainer();
  }

  get viewport(): SurfaceViewport {
    return this._renderer;
  }

  private _syncFromExistingContainer() {
    this._transact(() => {
      this._yContainer.forEach(yElement => {
        const type = yElement.get('type') as keyof PhasorElementType;
        const id = yElement.get('id') as id;
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
        this.slots.elementAdded.emit(id);
      });
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
        const element = new ElementCtor(yElement, this);
        element.computedValue = this._computedValue;
        element.mount(this._renderer);

        this._elements.set(element.id, element);

        if (element.index > this.indexes.max) {
          this.indexes.max = element.index;
        }
        this.slots.elementAdded.emit(id);
      } else if (type.action === 'update') {
        console.error('update event on yElements is not supported', event);
      } else if (type.action === 'delete') {
        const element = this._elements.get(id);
        assertExists(element);
        element.xywh;
        element.unmount();
        this._elements.delete(id);
        this.deleteElementLocalRecord(id);

        if (element.index === this.indexes.min) {
          this.indexes.min = generateKeyBetween(element.index, null);
        }
        this.slots.elementRemoved.emit(id);
      }
    });
  };

  private _transact(callback: () => void) {
    const doc = this._yContainer.doc as Y.Doc;
    doc.transact(callback, doc.clientID);
  }

  refresh() {
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
    properties: IElementUpdateProps<T>
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
    options: HitTestOptions = {
      expand: 10,
    }
  ): SurfaceElement[] {
    const size = options.expand ?? 10;
    const candidates = this._renderer.gridManager.search({
      x: x - size / 2,
      y: y - size / 2,
      w: size,
      h: size,
    });
    const picked = candidates.filter(element => element.hitTest(x, y, options));
    return picked;
  }

  pickTop(x: number, y: number): SurfaceElement | null {
    const results = this.pickByPoint(x, y);
    return results[results.length - 1] ?? null;
  }

  pickByBound(bound: IBound): SurfaceElement[] {
    const candidates = this._renderer.gridManager.search(bound);
    const picked = candidates.filter((element: SurfaceElement) => {
      const b = Bound.from(bound);
      return (
        element.containedByBounds(b) ||
        b.points.some((point, i, points) =>
          element.intersectWithLine(point, points[(i + 1) % points.length])
        )
      );
    });
    return picked;
  }

  getSortedElementsWithViewportBounds() {
    return this.pickByBound(this.viewport.viewportBounds).sort(compare);
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
        const zoom = normalizeWheelDeltaY(e.deltaY);
        _renderer.setZoom(zoom);
      }
    });
  }

  getElements() {
    return [...this._elements.values()];
  }

  getElementsByType<T extends keyof IPhasorElementType>(
    type: T
  ): IPhasorElementType[T][] {
    return this.getElements().filter(
      element => element.type === type
    ) as unknown as IPhasorElementType[T][];
  }

  updateElementLocalRecord(id: id, records: Partial<ElementLocalRecords>) {
    const elementLocalRecord = this._elementLocalRecords.get(id) ?? {
      display: true,
      opacity: 1,
    };
    this._elementLocalRecords.set(id, { ...elementLocalRecord, ...records });
    this.refresh();
  }

  getElementLocalRecord(id: id) {
    return this._elementLocalRecords.get(id) ?? { display: true, opacity: 1 };
  }

  deleteElementLocalRecord(id: id) {
    this._elementLocalRecords.delete(id);
  }
}
