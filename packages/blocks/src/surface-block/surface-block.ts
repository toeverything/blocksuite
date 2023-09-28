import '../page-block/edgeless/edgeless-blocks-container.js';

import { assertExists, Slot } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import type { BlockProps } from '@blocksuite/store';
import type { BaseBlockModel } from '@blocksuite/store';
import { Workspace, type Y } from '@blocksuite/store';
import { css, html, nothing } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import type {
  EdgelessElement,
  TopLevelBlockModel,
} from '../__internal__/index.js';
import {
  type CssVariableName,
  isCssVariable,
} from '../__internal__/theme/css-variables.js';
import { getThemePropertyValue } from '../__internal__/theme/utils.js';
import { EdgelessConnectorManager } from '../page-block/edgeless/connector-manager.js';
import type { EdgelessPageBlockComponent } from '../page-block/edgeless/edgeless-page-block.js';
import { EdgelessFrameManager } from '../page-block/edgeless/frame-manager.js';
import {
  getEdgelessElement,
  isConnectable,
  isFrameBlock,
  isTopLevelBlock,
} from '../page-block/edgeless/utils/query.js';
import { EdgelessSnapManager } from '../page-block/edgeless/utils/snap-manager.js';
import { Batch } from './batch.js';
import type { IBound } from './consts.js';
import type { EdgelessBlockType } from './edgeless-types.js';
import {
  type EdgelessElementType,
  type IEdgelessElementCreateProps,
} from './edgeless-types.js';
import {
  type HitTestOptions,
  type IElementCreateProps,
  type IElementUpdateProps,
  type IPhasorElementType,
  isPhasorElementType,
} from './elements/edgeless-element.js';
import {
  ConnectorElement,
  ElementCtors,
  ElementDefaultProps,
  type IPhasorElementLocalRecord,
  type PhasorElement,
} from './elements/index.js';
import type { SurfaceElement } from './elements/surface-element.js';
import { compare } from './grid.js';
import type { IVec, PhasorElementType } from './index.js';
import { Renderer } from './renderer.js';
import { randomSeed } from './rough/math.js';
import type { SurfaceBlockModel } from './surface-model.js';
import type { Bound } from './utils/bound.js';
import { getCommonBound } from './utils/bound.js';
import {
  generateElementId,
  generateKeyBetween,
  normalizeWheelDeltaY,
} from './utils/index.js';
import { serializeXYWH } from './utils/xywh.js';

type id = string;
export enum EdgelessBlocksFlavour {
  NOTE = 'affine:note',
  FRAME = 'affine:frame',
}

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
      display: block;
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
      background-color: var(--affine-background-primary-color);
      z-index: 0;
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

  get edgeless() {
    return this.parentBlockElement as EdgelessPageBlockComponent;
  }

  private get _isEdgeless() {
    return this.root.mode === 'edgeless';
  }

  get blocks() {
    return [...this.edgeless.notes, ...this.edgeless.frames];
  }

  @query('.affine-edgeless-surface-block-container')
  private _surfaceContainer!: HTMLElement;

  override connectedCallback() {
    if (!this._isEdgeless) return;
    super.connectedCallback();
    const { edgeless } = this;
    this._renderer = new Renderer();
    this._yContainer = this.model.elements.getValue() as Y.Map<Y.Map<unknown>>;
    this._yContainer.observe(this._onYContainer);

    this._initEvents();
    this.connector = new EdgelessConnectorManager(edgeless);
    this.frame = new EdgelessFrameManager(edgeless);
    this.snap = new EdgelessSnapManager(edgeless);

    this.init();
  }

  getCSSPropertyValue = (value: string) => {
    const root = this.root;
    if (isCssVariable(value)) {
      const cssValue = getThemePropertyValue(root, value as CssVariableName);
      if (cssValue === undefined) {
        console.error(
          new Error(
            `All variables should have a value. Please check for any dirty data or variable renaming.Variable: ${value}`
          )
        );
      }
      return cssValue ?? value;
    }

    return value;
  };

  private _initEvents() {
    const { page } = this;
    this._disposables.add(
      this.slots.elementAdded.on(id => {
        const element = this.pickById(id);
        assertExists(element);
        if (element instanceof ConnectorElement) {
          // FIXME waiting for refactor
          if (!this.connector.hasRelatedElement(element)) return;

          this.connector.updatePath(element);
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
        if (isConnectable(element)) {
          this.connector.syncConnectorPos([element]);
        }
      })
    );

    this._disposables.add(
      this.page.slots.blockUpdated.on(e => {
        if (e.type === 'add') {
          const model = page.getBlockById(e.id) as TopLevelBlockModel;
          assertExists(model);
          if (isFrameBlock(model)) {
            requestAnimationFrame(() => {
              this.frame.calculateFrameColor(model);
            });
          }
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
    `;
  }

  override firstUpdated() {
    if (!this._isEdgeless) return;
    this.attach(this._surfaceContainer);
  }

  init() {
    this._syncFromExistingContainer();
  }

  // query
  pickTopBlock(point: IVec) {
    const models = this.edgeless.sortedBlocks;
    for (let i = models.length - 1; i >= 0; i--) {
      const model = models[i];
      if (model.hitTest(point[0], point[1], {}, this)) {
        return model;
      }
    }
    return null;
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
        const type = yElement.get('type') as PhasorElementType;
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
    const type = yElement.get('type') as PhasorElementType;
    const id = yElement.get('id') as id;
    const ElementCtor = ElementCtors[type];
    assertExists(ElementCtor);
    const element = new ElementCtor(yElement, this);
    element.computedValue = this.getCSSPropertyValue;
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
      const type = yElement.get('type') as PhasorElementType;

      const ElementCtor = ElementCtors[type];
      assertExists(ElementCtor);
      const element = new ElementCtor(yElement, this);
      element.computedValue = this.getCSSPropertyValue;
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

  addElement<T extends PhasorElementType>(
    type: T,
    properties: IElementCreateProps<T>
  ): id;
  addElement<K extends EdgelessBlockType>(
    type: K,
    properties: Partial<BlockProps & Omit<BlockProps, 'flavour'>>,
    parent?: BaseBlockModel | string | null,
    parentIndex?: number
  ): id;
  addElement<T extends EdgelessElementType>(
    type: T,
    properties: IEdgelessElementCreateProps<T>,
    parent?: BaseBlockModel | string | null,
    parentIndex?: number
  ) {
    if (this.page.readonly) {
      throw new Error('Cannot add element in readonly mode');
    }

    if (isPhasorElementType(type)) {
      const attr = properties as IElementCreateProps<typeof type>;
      const id = generateElementId();

      const yMap = new Workspace.Y.Map();

      const defaultProps = ElementDefaultProps[type];
      const batch = this.getBatch(attr.batch ?? this._defaultBatch);
      const props: IElementCreateProps<typeof type> = {
        ...defaultProps,
        ...properties,
        id,
        index: generateKeyBetween(batch.max, null),
        seed: randomSeed(),
      };

      this._transact(() => {
        for (const [key, value] of Object.entries(props)) {
          if (
            (key === 'text' || key === 'title') &&
            //@ts-ignore
            !(value instanceof Workspace.Y.Text)
          ) {
            yMap.set(key, new Workspace.Y.Text(value));
          } else {
            yMap.set(key, value);
          }
        }
        this._yContainer.set(id, yMap);
      });

      return id;
    } else {
      return this.page.addBlock(type, properties, parent, parentIndex);
    }
  }

  updateElement<T extends PhasorElementType>(
    id: id,
    properties: IElementUpdateProps<T>
  ): void;
  updateElement(id: id, properties: Partial<BlockProps>): void;
  updateElement<T extends PhasorElementType>(
    id: id,
    properties: IElementUpdateProps<T> | Partial<BlockProps>
  ) {
    if (this.page.readonly) {
      throw new Error('Cannot update element in readonly mode');
    }
    const element = this.pickById(id);
    if (isTopLevelBlock(element)) {
      this.page.updateBlock(element, properties);
    } else {
      this._transact(() => {
        const element = this._elements.get(id);
        assertExists(element);
        element.applyUpdate(properties);
      });
    }
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
    const element = this.pickById(id);
    if (isTopLevelBlock(element)) {
      this.page.deleteBlock(element);
    } else {
      this._transact(() => {
        this._yContainer.delete(id);
      });
    }
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

  pickById(id: string): EdgelessElement | null {
    return (
      this._elements.get(id) ??
      (this.page.getBlockById(id) as TopLevelBlockModel)
    );
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
    return results[results.length - 1] ?? this.pickTopBlock([x, y]);
  }

  pickByBound(bound: Bound): EdgelessElement[] {
    const candidates = [
      ...this._renderer.gridManager.search(bound),
      ...this.blocks,
    ];
    const picked = candidates.filter(element => element.boxSelect(bound));
    return picked;
  }

  getSortedPhasorElementsWithViewportBounds() {
    return this.pickByBound(this.viewport.viewportBounds)
      .filter(e => !isTopLevelBlock(e))
      .sort(compare);
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
