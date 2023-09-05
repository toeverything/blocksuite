import '../page-block/edgeless/edgeless-blocks-container.js';

import { assertExists, Slot } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import { css, html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import * as Y from 'yjs';

import { EdgelessConnectorManager } from '../page-block/edgeless/connector-manager.js';
import type { EdgelessPageBlockComponent } from '../page-block/edgeless/edgeless-page-block.js';
import { EdgelessFrameManager } from '../page-block/edgeless/frame-manager.js';
import { getEdgelessElement } from '../page-block/edgeless/utils/query.js';
import { EdgelessSnapManager } from '../page-block/edgeless/utils/snap-manager.js';
import { Batch } from './batch.js';
import type { IBound } from './consts.js';
import {
  ConnectorElement,
  ElementCtors,
  ElementDefaultProps,
  FrameElement,
  type IElementCreateProps,
  type IElementUpdateProps,
  type IPhasorElementLocalRecord,
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
import { Renderer } from './renderer.js';
import { randomSeed } from './rough/math.js';
import type { SurfaceBlockModel } from './surface-model.js';
import { Bound, getCommonBound } from './utils/bound.js';
import {
  generateElementId,
  generateKeyBetween,
  normalizeWheelDeltaY,
} from './utils/index.js';
import { serializeXYWH } from './utils/xywh.js';

type id = string;
@customElement('affine-surface')
export class SurfaceBlockComponent extends BlockElement<SurfaceBlockModel> {
  static override styles = css`
    .affine-edgeless-surface-block-container {
      position: absolute;
      width: 100%;
      height: 100%;
    }

    .affine-edgeless-surface-block-container canvas {
      width: 100%;
      height: 100%;
      position: relative;
      z-index: 1;
      pointer-events: none;
    }

    affine-edgeless-block-container {
      position: relative;
      box-sizing: border-box;
      overflow: hidden;
      height: 100%;
      font-family: var(--affine-font-family);
      font-size: var(--affine-font-base);
      line-height: var(--affine-line-height);
      color: var(--affine-text-primary-color);
      font-weight: 400;
    }

    .affine-block-children-container.edgeless {
      padding-left: 0;
      position: relative;
      overflow: hidden;
      height: 100%;
      /**
       * Fix: pointerEvent stops firing after a short time.
       * When a gesture is started, the browser intersects the touch-action values of the touched element and its ancestors,
       * up to the one that implements the gesture (in other words, the first containing scrolling element)
       * https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
       */
      touch-action: none;

      background-size: var(--affine-edgeless-gap) var(--affine-edgeless-gap);
      background-position: var(--affine-edgeless-x) var(--affine-edgeless-y);
      background-color: var(--affine-background-primary-color);
      background-image: var(--affine-edgeless-grid);
      z-index: 0;
    }

    .affine-edgeless-layer {
      position: absolute;
      top: 0;
      left: 0;
      contain: layout style size;
      transform: translate(var(--affine-edgeless-x), var(--affine-edgeless-y))
        scale(var(--affine-zoom));
    }

    .affine-edgeless-block-child {
      position: absolute;
      transform-origin: center;
      box-sizing: border-box;
      border: 2px solid var(--affine-white-10);
      border-radius: 8px;
      box-shadow: var(--affine-shadow-3);
      pointer-events: all;
    }
  `;

  private _renderer!: Renderer;
  private _yContainer!: Y.Map<Y.Map<unknown>>;
  private _elements = new Map<id, SurfaceElement>();
  private _elementLocalRecords = new Map<
    id,
    IPhasorElementLocalRecord[keyof IPhasorElementLocalRecord]
  >();

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  private _computedValue!: ComputedValue;

  snap!: EdgelessSnapManager;
  connector!: EdgelessConnectorManager;
  frame!: EdgelessFrameManager;

  private _defaultBatch = 'a1';
  private _batches = new Map<string, Batch<SurfaceElement>>();

  slots = {
    elementUpdated: new Slot<{
      id: id;
      props: { [index: string]: { old: unknown; new: unknown } };
    }>(),
    elementAdded: new Slot<id>(),
    elementRemoved: new Slot<{ id: id; element: SurfaceElement }>(),
  };

  private get _isEdgeless() {
    return this.edgeless && this.edgeless.editorContainer.mode === 'edgeless';
  }

  @query('.affine-edgeless-surface-block-container')
  private _surfaceContainer!: HTMLElement;

  override connectedCallback() {
    if (!this._isEdgeless) return;
    super.connectedCallback();
    const { edgeless } = this;
    this._renderer = new Renderer();
    if (this.model)
      this._yContainer = this.model.elements.getValue() as Y.Map<
        Y.Map<unknown>
      >;
    this._yContainer.observe(this._onYContainer);

    this._initEvents();
    this.connector = new EdgelessConnectorManager(edgeless);
    this.frame = new EdgelessFrameManager(edgeless);
    this.snap = new EdgelessSnapManager(edgeless);

    this.init();
  }

  private _initEvents() {
    this._disposables.add(
      this.slots.elementAdded.on(id => {
        const element = this.pickById(id);
        assertExists(element);
        if (element instanceof ConnectorElement) {
          // FIXME waiting for refactor
          if (!this.connector.hasRelatedElement(element)) return;

          this.connector.updatePath(element);
        } else if (element instanceof FrameElement) {
          this.frame.calculateFrameColor(element);
        }
      })
    );

    this._disposables.add(
      this.slots.elementUpdated.on(({ id, props }) => {
        if ('xywh' in props || 'rotate' in props) {
          this.edgeless.slots.elementSizeUpdated.emit(id);
        }

        const element = this.pickById(id);
        assertExists(element);

        if (element instanceof ConnectorElement) {
          if ('target' in props || 'source' in props || 'mode' in props) {
            this.connector.updatePath(element);
          }
        }
      })
    );

    this._disposables.add(
      this.edgeless.slots.elementSizeUpdated.on(id => {
        const element = getEdgelessElement(this.edgeless, id);
        if (element) {
          this.connector.syncConnectorPos([element]);
        }
      })
    );
  }

  override render() {
    if (!this._isEdgeless) return nothing;
    return html`
      <div class="affine-edgeless-surface-block-container">
        <!-- attach canvas later in Phasor -->
      </div>
      <affine-edgeless-block-container .edgeless=${this.edgeless}>
      </affine-edgeless-block-container>
    `;
  }

  override firstUpdated() {
    if (!this._isEdgeless) return;
    this.edgeless.surface.attach(this._surfaceContainer);
  }

  init() {
    this._syncFromExistingContainer();
  }

  get viewport(): Renderer {
    return this._renderer;
  }

  get defaultBatch() {
    return this._defaultBatch;
  }

  getBatch(id: string) {
    const batch = this._batches.get(id);
    if (batch) return batch;
    const newBatch = new Batch<SurfaceElement>(id);
    this._batches.set(id, newBatch);
    return newBatch;
  }

  private _addToBatch(element: SurfaceElement) {
    const batch = element.batch ?? this._defaultBatch;
    this.getBatch(batch).addElement(element);
  }

  private _removeFromBatch(element: SurfaceElement) {
    const batch = element.batch ?? this._defaultBatch;
    this.getBatch(batch).deleteElement(element);
  }

  private _syncFromExistingContainer() {
    this._transact(() => {
      const yConnectors: Y.Map<unknown>[] = [];
      this._yContainer.forEach(yElement => {
        const type = yElement.get('type') as keyof PhasorElementType;
        if (type === 'connector') {
          yConnectors.push(yElement);
          return;
        }
        this._createElementFromYMap(yElement);
      });
      yConnectors.forEach(yElement => {
        this._createElementFromYMap(yElement);
      });
    });
  }

  private _createElementFromYMap(yElement: Y.Map<unknown>) {
    const type = yElement.get('type') as keyof PhasorElementType;
    const id = yElement.get('id') as id;
    const ElementCtor = ElementCtors[type];
    assertExists(ElementCtor);
    const element = new ElementCtor(yElement, this);
    element.computedValue = this._computedValue;
    element.mount(this._renderer);
    this._elements.set(element.id, element);
    this._addToBatch(element);
    this.slots.elementAdded.emit(id);
  }

  private _onYContainer = (event: Y.YMapEvent<Y.Map<unknown>>) => {
    // skip empty event
    if (event.changes.keys.size === 0) return;
    const connectors: {
      change: (typeof event)['changes']['keys'] extends Map<string, infer V>
        ? V
        : never;
      id: string;
    }[] = [];
    event.keysChanged.forEach(id => {
      const change = event.changes.keys.get(id);
      if (!change) {
        console.error('invalid event', event);
        return;
      }

      if (
        change.action === 'add' &&
        this._yContainer.get(id)?.get('type') === 'connector'
      ) {
        connectors.push({ change, id });
        return;
      } else {
        this._onYEvent(change, id);
      }
    });
    connectors.forEach(({ change, id }) => this._onYEvent(change, id));
  };

  private _onYEvent = (
    type: Y.YMapEvent<Y.Map<unknown>>['changes']['keys'] extends Map<
      string,
      infer V
    >
      ? V
      : never,
    id: string
  ) => {
    if (type.action === 'add') {
      const yElement = this._yContainer.get(id) as Y.Map<unknown>;
      const type = yElement.get('type') as keyof PhasorElementType;

      const ElementCtor = ElementCtors[type];
      assertExists(ElementCtor);
      const element = new ElementCtor(yElement, this);
      element.computedValue = this._computedValue;
      element.mount(this._renderer);
      this._elements.set(element.id, element);

      this._addToBatch(element);
      this.slots.elementAdded.emit(id);
    } else if (type.action === 'update') {
      console.error('update event on yElements is not supported', event);
    } else if (type.action === 'delete') {
      const element = this._elements.get(id);
      assertExists(element);

      element.unmount();
      this._elements.delete(id);
      this.deleteElementLocalRecord(id);
      this._removeFromBatch(element);
      this.slots.elementRemoved.emit({ id, element });
    }
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
    callback?: (keys: string[]) => void
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

      callback && callback(keys);
    });
  }

  attach(container: HTMLElement) {
    this._renderer.attach(container);
  }

  onResize() {
    this._renderer.onResize();
  }

  getElementsBound(): IBound | null {
    return getCommonBound(Array.from(this._elements.values()));
  }

  addElement<T extends keyof IPhasorElementType>(
    type: T,
    properties: IElementCreateProps<T>
  ): PhasorElement['id'] {
    if (this.page.readonly) {
      throw new Error('Cannot add element in readonly mode');
    }

    const id = generateElementId();

    const yMap = new Y.Map();

    const defaultProps = ElementDefaultProps[type];
    const batch = this.getBatch(properties.batch ?? this._defaultBatch);
    const props: IElementCreateProps<T> = {
      ...defaultProps,
      ...properties,
      id,
      index: generateKeyBetween(batch.max, null),
      seed: randomSeed(),
    };

    this._transact(() => {
      for (const [key, value] of Object.entries(props)) {
        if ((key === 'text' || key === 'title') && !(value instanceof Y.Text)) {
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
    if (this.page.readonly) {
      throw new Error('Cannot update element in readonly mode');
    }

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

  setDefaultBatch(batch: string) {
    this._defaultBatch = batch;
  }

  removeElement(id: string) {
    if (this.page.readonly) {
      throw new Error('Cannot remove element in readonly mode');
    }

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

  pickTop(
    x: number,
    y: number,
    options?: HitTestOptions
  ): SurfaceElement | null {
    const results = this.pickByPoint(x, y, options);
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
    return Array.from(this._elements.values());
  }

  getElementsByType<T extends keyof IPhasorElementType>(
    type: T
  ): IPhasorElementType[T][] {
    return this.getElements().filter(
      element => element.type === type
    ) as unknown as IPhasorElementType[T][];
  }

  updateElementLocalRecord<T extends keyof IPhasorElementLocalRecord>(
    id: id,
    records: IPhasorElementLocalRecord[T]
  ) {
    const elementLocalRecord = this._elementLocalRecords.get(id);
    if (elementLocalRecord) {
      this._elementLocalRecords.set(id, { ...elementLocalRecord, ...records });
    } else {
      this._elementLocalRecords.set(id, records);
    }
    this.refresh();
  }

  getElementLocalRecord<T extends keyof IPhasorElementLocalRecord>(id: id) {
    return this._elementLocalRecords.get(id) as
      | IPhasorElementLocalRecord[T]
      | undefined;
  }

  deleteElementLocalRecord(id: id) {
    this._elementLocalRecords.delete(id);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-surface': SurfaceBlockComponent;
  }
}
