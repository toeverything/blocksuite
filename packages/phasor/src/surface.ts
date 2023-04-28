import { assertExists } from '@blocksuite/global/utils';
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';
import * as Y from 'yjs';

import type { IBound } from './consts.js';
import type {
  HitTestOptions,
  TransformPropertyValue,
} from './elements/base-element.js';
import { defaultTransformPropertyValue } from './elements/base-element.js';
import type {
  BrushProps,
  CreateBrushProps,
  SerializedBrushProps,
} from './elements/brush/types.js';
import type {
  ConnectorProps,
  Controller,
  CreateConnectorProps,
  SerializedConnectorProps,
} from './elements/connector/types.js';
import type { CreateDebugProps } from './elements/debug/debug-element.js';
import type { ShapeProps } from './elements/index.js';
import {
  BrushElement,
  ConnectorElement,
  DebugElement,
  ElementCtors,
  type PhasorElement,
  type PhasorElementType,
  ShapeElement,
} from './elements/index.js';
import type { CreateShapeProps } from './elements/shape/types.js';
import { compare } from './grid.js';
import { intersects } from './index.js';
import type { SurfaceViewport } from './renderer.js';
import { Renderer } from './renderer.js';
import { contains, getCommonBound } from './utils/bound.js';
import { updateYElementProps } from './utils/operation.js';
import { generateElementId } from './utils/std.js';
import { deserializeXYWH, serializeXYWH, setXYWH } from './utils/xywh.js';

export class SurfaceManager {
  private _renderer: Renderer;
  private _yElements: Y.Map<Y.Map<unknown>>;
  private _elements = new Map<string, PhasorElement>();
  private _bindings = new Map<string, Set<string>>();
  private _lastIndex = 'a0';

  private _transformPropertyValue: TransformPropertyValue;

  constructor(
    yContainer: Y.Map<unknown>,
    transformPropertyValue: TransformPropertyValue = defaultTransformPropertyValue
  ) {
    this._renderer = new Renderer();
    this._yElements = yContainer as Y.Map<Y.Map<unknown>>;
    this._transformPropertyValue = transformPropertyValue;

    this._syncFromExistingContainer();
    this._yElements.observeDeep(this._handleYEvents);
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

  addShapeElement(properties: CreateShapeProps) {
    const id = generateElementId();
    const element = new ShapeElement(id);
    element.transformPropertyValue = this._transformPropertyValue;
    const updated = ShapeElement.getUpdatedSerializedProps(element, properties);
    ShapeElement.applySerializedProps(element, updated);

    return this._addElement(element);
  }

  addDebugElement(properties: CreateDebugProps) {
    const id = generateElementId();
    const element = new DebugElement(id);
    DebugElement.applySerializedProps(element, properties);
    return this._addElement(element);
  }

  addBrushElement(properties: CreateBrushProps) {
    const id = generateElementId();
    const element = new BrushElement(id);
    element.transformPropertyValue = this._transformPropertyValue;
    const updated = BrushElement.getUpdatedSerializedProps(element, properties);
    BrushElement.applySerializedProps(element, updated);

    return this._addElement(element);
  }

  updateBrushElement(id: string, properties: Partial<SerializedBrushProps>) {
    const element = this._elements.get(id);
    assertExists(element);
    const updated = BrushElement.getUpdatedSerializedProps(
      element as BrushElement,
      properties
    );
    this._transact(() => {
      const yElement = this._yElements.get(id) as Y.Map<unknown>;
      assertExists(yElement);
      updateYElementProps(yElement, updated);
    });
  }

  addConnectorElement(properties: CreateConnectorProps) {
    const id = generateElementId();
    const element = new ConnectorElement(id);
    element.transformPropertyValue = this._transformPropertyValue;
    const updated = ConnectorElement.getUpdatedSerializedProps(
      element,
      properties
    );
    ConnectorElement.applySerializedProps(element, updated);

    return this._addElement(element);
  }

  updateConnectorElement(
    id: string,
    properties: Partial<SerializedConnectorProps>
  ) {
    const element = this._elements.get(id);
    assertExists(element);
    const updated = ConnectorElement.getUpdatedSerializedProps(
      element as ConnectorElement,
      properties
    );
    this._transact(() => {
      const yElement = this._yElements.get(id) as Y.Map<unknown>;
      assertExists(yElement);
      updateYElementProps(yElement, updated);
    });
    if (updated.startElement) {
      this._addBinding(updated.startElement.id, id);
      this._addBinding(id, updated.startElement.id);
    }
    if (updated.endElement) {
      this._addBinding(updated.endElement.id, id);
      this._addBinding(id, updated.endElement.id);
    }
  }

  updateElementProps(
    id: string,
    rawProps: ShapeProps | BrushProps | ConnectorProps
  ) {
    this._transact(() => {
      const element = this._elements.get(id);
      assertExists(element);
      const ElementCtor = ElementCtors[element.type];
      assertExists(ElementCtor);

      const props = ElementCtor.getProps(element, rawProps);

      const yElement = this._yElements.get(id) as Y.Map<unknown>;
      assertExists(yElement);
      for (const [key, value] of Object.entries(props)) {
        yElement.set(key, value);
      }
    });
  }

  setElementBound(id: string, bound: IBound) {
    this._transact(() => {
      const element = this._elements.get(id);
      assertExists(element);
      const ElementCtor = ElementCtors[element.type];
      assertExists(ElementCtor);

      if (element.type === 'connector') {
        const updated = ElementCtors[element.type].getUpdatedSerializedProps(
          element,
          { xywh: serializeXYWH(bound.x, bound.y, bound.w, bound.h) }
        );
        const yElement = this._yElements.get(id) as Y.Map<unknown>;
        assertExists(yElement);
        updateYElementProps(yElement, updated);
        return;
      }
      if (element.type === 'brush') {
        const updated = ElementCtors[element.type].getUpdatedSerializedProps(
          element,
          { xywh: serializeXYWH(bound.x, bound.y, bound.w, bound.h) }
        );
        const yElement = this._yElements.get(id) as Y.Map<unknown>;
        assertExists(yElement);
        updateYElementProps(yElement, updated);
        return;
      }
      const props = ElementCtor.getBoundProps(element, bound);
      const yElement = this._yElements.get(id) as Y.Map<unknown>;
      assertExists(yElement);
      for (const [key, value] of Object.entries(props)) {
        yElement.set(key, value);
      }
    });
  }

  removeElement(id: string) {
    this._transact(() => {
      this._yElements.delete(id);
    });
  }

  hasElement(id: string) {
    return this._yElements.has(id);
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

  pickByPoint(x: number, y: number, options?: HitTestOptions): PhasorElement[] {
    const bound: IBound = { x: x - 1, y: y - 1, w: 2, h: 2 };
    const candidates = this._renderer.gridManager.search(bound);
    const picked = candidates.filter((element: PhasorElement) => {
      return element.hitTest(x, y, options);
    });

    return picked;
  }

  pickTop(x: number, y: number): PhasorElement | null {
    const results = this.pickByPoint(x, y);
    return results[results.length - 1] ?? null;
  }

  pickByBound(bound: IBound): PhasorElement[] {
    const candidates = this._renderer.gridManager.search(bound);
    const picked = candidates.filter((element: PhasorElement) => {
      return contains(bound, element) || intersects(bound, element);
    });

    return picked;
  }

  addElements(elements: PhasorElement[]) {
    elements.forEach(element => this._addElement(element));
  }

  moveToBack(elementIds: string[]) {
    if (!elementIds.length) {
      return;
    }

    let startIndex = this._lastIndex;
    this._elements.forEach(element => {
      if (elementIds.includes(element.id)) {
        return;
      }
      if (element.index < startIndex) {
        startIndex = element.index;
      }
    });

    const keys = generateNKeysBetween(null, startIndex, elementIds.length);

    const sortedElements = (
      elementIds
        .map(id => this._elements.get(id))
        .filter(e => !!e) as PhasorElement[]
    ).sort(compare);

    this._transact(() => {
      sortedElements.forEach((ele, index) => {
        const yElement = this._yElements.get(ele.id) as Y.Map<unknown>;
        yElement.set('index', keys[index]);
      });
    });
  }

  moveToFront(elementIds: string[]) {
    if (!elementIds.length) {
      return;
    }

    const keys = generateNKeysBetween(this._lastIndex, null, elementIds.length);

    const sortedElements = (
      elementIds
        .map(id => this._elements.get(id))
        .filter(e => !!e) as PhasorElement[]
    ).sort(compare);

    this._transact(() => {
      sortedElements.forEach((ele, index) => {
        const yElement = this._yElements.get(ele.id) as Y.Map<unknown>;
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
      .filter(e => !!e) as PhasorElement[];
  }

  private _addBinding(id0: string, id1: string) {
    if (!this._bindings.has(id0)) {
      this._bindings.set(id0, new Set());
    }
    this._bindings.get(id0)?.add(id1);
  }

  private _handleYElementAdded(yElement: Y.Map<unknown>) {
    const type = yElement.get('type') as PhasorElementType;

    const ElementCtor = ElementCtors[type];
    assertExists(ElementCtor);
    const element = ElementCtor.deserialize(yElement.toJSON());
    assertExists(element);
    element.transformPropertyValue = this._transformPropertyValue;

    this._renderer.addElement(element);
    this._elements.set(element.id, element);

    if (element.index > this._lastIndex) {
      this._lastIndex = element.index;
    }

    if (element.type === 'connector') {
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
    this._yElements.forEach(yElement => this._handleYElementAdded(yElement));
  }

  private _addElement(element: PhasorElement) {
    element.index = generateKeyBetween(this._lastIndex, null);

    this._transact(() => {
      const yElement = this._createYElement(element);
      this._yElements.set(element.id, yElement);
    });

    return element.id;
  }

  private _createYElement(element: Omit<PhasorElement, 'id'>) {
    const serialized = element.serialize();
    const yElement = new Y.Map<unknown>();
    updateYElementProps(yElement, serialized);
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

        this._renderer.removeElement(element);
        switch (key) {
          case 'xywh': {
            const xywh = yElement.get(key) as string;
            const [x, y, w, h] = deserializeXYWH(xywh);
            setXYWH(element, { x, y, w, h });
            break;
          }
          case 'points': {
            const points = yElement.get(key) as number[][];
            (element as BrushElement).points = points;
            break;
          }
          case 'controllers': {
            const controllers = yElement.get(key) as Controller[];
            (element as ConnectorElement).controllers = controllers;
            break;
          }
          default: {
            const v = yElement.get(key);
            // FIXME: update element prop
            // @ts-expect-error should be fixed
            element[key] = v;
          }
        }
        this._renderer.addElement(element);
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
