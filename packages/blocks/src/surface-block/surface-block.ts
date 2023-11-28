import '../page-block/edgeless/components/block-portal/edgeless-block-portal.js';

import { assertExists } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import type { BlockProps } from '@blocksuite/store';
import type { BaseBlockModel } from '@blocksuite/store';
import { Workspace, type Y } from '@blocksuite/store';
import { css, html, nothing } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import {
  type CssVariableName,
  isCssVariable,
} from '../_common/theme/css-variables.js';
import { getThemePropertyValue } from '../_common/theme/utils.js';
import {
  type EdgelessElement,
  type ReorderingAction,
  type Selectable,
  type TopLevelBlockModel,
} from '../_common/utils/index.js';
import { last } from '../_common/utils/iterable.js';
import type { EdgelessBlockPortalContainer } from '../page-block/edgeless/components/block-portal/edgeless-block-portal.js';
import { EdgelessConnectorManager } from '../page-block/edgeless/connector-manager.js';
import type { EdgelessPageBlockComponent } from '../page-block/edgeless/edgeless-page-block.js';
import { EdgelessFrameManager } from '../page-block/edgeless/frame-manager.js';
import { getGridBound } from '../page-block/edgeless/utils/bound-utils.js';
import {
  isConnectable,
  isFrameBlock,
  isImageBlock,
  isNoteBlock,
  isTopLevelBlock,
} from '../page-block/edgeless/utils/query.js';
import { EdgelessSnapManager } from '../page-block/edgeless/utils/snap-manager.js';
import type { IBound } from './consts.js';
import {
  type EdgelessBlockModelMap,
  EdgelessBlockType,
} from './edgeless-types.js';
import {
  EdgelessElementType,
  type IEdgelessElementCreateProps,
} from './edgeless-types.js';
import {
  type HitTestOptions,
  type ICanvasElementType,
  type IElementCreateProps,
  type IElementUpdateProps,
  isCanvasElementType,
} from './elements/edgeless-element.js';
import { GROUP_ROOT } from './elements/group/consts.js';
import {
  BrushElement,
  ConnectorElement,
  ElementCtors,
  ElementDefaultProps,
  GroupElement,
} from './elements/index.js';
import type { SurfaceElement } from './elements/surface-element.js';
import type { CanvasElementType, IVec } from './index.js';
import {
  compare,
  EdgelessGroupManager,
  getGroupParent,
  isDescendant,
  setGroupParent,
} from './managers/group-manager.js';
import { LayerManager } from './managers/layer-manager.js';
import { Renderer } from './renderer.js';
import { randomSeed } from './rough/math.js';
import type { SurfaceBlockModel } from './surface-model.js';
import { Bound } from './utils/bound.js';
import { getCommonBound } from './utils/bound.js';
import {
  generateElementId,
  generateNKeysBetween,
  normalizeWheelDeltaY,
} from './utils/index.js';
import { serializeXYWH } from './utils/xywh.js';

type id = string;

const { NOTE, IMAGE, FRAME } = EdgelessBlockType;

export enum EdgelessBlocksFlavour {
  NOTE = 'affine:note',
  FRAME = 'affine:frame',
}

export type IndexedCanvasUpdateEvent = CustomEvent<{
  content: HTMLCanvasElement[];
}>;

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

    edgeless-block-portal-container {
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
      background-image: radial-gradient(
        var(--affine-edgeless-grid-color) 1px,
        var(--affine-background-primary-color) 1px
      );
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

  private _indexedCanvases: HTMLCanvasElement[] = [];

  snap!: EdgelessSnapManager;
  connector!: EdgelessConnectorManager;
  frame!: EdgelessFrameManager;
  group!: EdgelessGroupManager;
  layer!: LayerManager;

  compare = compare;
  getGroupParent = getGroupParent;
  setGroupParent = setGroupParent;

  private _lastTime = 0;
  private _cachedViewport = new Bound();

  @query('edgeless-block-portal-container')
  portal!: EdgelessBlockPortalContainer;

  get renderer() {
    return this._renderer;
  }

  get edgeless() {
    return this.parentBlockElement as EdgelessPageBlockComponent;
  }

  private get _isEdgeless() {
    return !!this.root.querySelector('affine-edgeless-page');
  }

  getBlocks<T extends EdgelessBlockType>(
    flavours: T[] | T
  ): TopLevelBlockModel[] {
    flavours = typeof flavours === 'string' ? [flavours] : flavours;

    return flavours.reduce<TopLevelBlockModel[]>((pre, flavour) => {
      const parent: BaseBlockModel =
        flavour === EdgelessBlockType.NOTE ? this.edgeless.model : this.model;

      return pre.concat(
        parent.children
          .filter(child => child.flavour === flavour)
          .map(child =>
            this.edgeless.localRecord.wrap(child)
          ) as EdgelessBlockModelMap[T][]
      );
    }, []);
  }

  getSortedBlocks<T extends EdgelessBlockType>(flavour: T | T[]) {
    const flavours = typeof flavour === 'string' ? [flavour] : flavour;
    let blocks: TopLevelBlockModel[] = [];

    flavours.forEach(f => {
      blocks = blocks.concat(this.getBlocks(f) ?? []);
    });

    return blocks.sort(this.compare);
  }

  get blocks() {
    return [
      ...this.getBlocks(FRAME),
      ...this.getBlocks(NOTE),
      ...this.getBlocks(IMAGE),
    ];
  }

  get sortedBlocks() {
    return [
      ...this.getBlocks(FRAME).sort(this.compare),
      ...[...this.getBlocks(NOTE), ...this.getBlocks(IMAGE)].sort(this.compare),
    ];
  }

  @query('.affine-edgeless-surface-block-container')
  private _surfaceContainer!: HTMLElement;

  override connectedCallback() {
    super.connectedCallback();
    if (!this._isEdgeless) return;
    const { edgeless } = this;
    this.layer = new LayerManager();
    this._renderer = new Renderer({ layerManager: this.layer });
    this._yContainer = this.model.elements.getValue() as Y.Map<Y.Map<unknown>>;
    this._yContainer.observe(this._onYContainer);

    this.connector = new EdgelessConnectorManager(edgeless);
    this.frame = new EdgelessFrameManager(edgeless);
    this.snap = new EdgelessSnapManager(edgeless);
    this.group = new EdgelessGroupManager(this);
    this.init();

    this.layer.init([...this._elements.values(), ...this.blocks]);

    this._initEvents();
    this._initEffects();
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
    const { _disposables, edgeless } = this;

    _disposables.add(edgeless.slots.reorderingElements.on(this._reorder));

    _disposables.add(
      edgeless.slots.elementAdded.on(id => {
        const element = this.pickById(id);
        assertExists(element);
        if (element instanceof ConnectorElement) {
          // FIXME waiting for refactor
          if (!this.connector.hasRelatedElement(element)) return;
          this.connector.updatePath(element);
        }

        this.layer.add(element);
      })
    );

    _disposables.add(
      edgeless.slots.elementUpdated.on(({ id, props }) => {
        const element = this.pickById(id);
        assertExists(element);

        if (element instanceof ConnectorElement) {
          this.connector.updatePath(element);
        }

        this.layer.update(element, props);
      })
    );

    _disposables.add(
      edgeless.slots.elementUpdated.on(({ id, props }) => {
        if (!props || 'xywh' in props || 'rotate' in props) {
          const element = this.pickById(id);
          if (isConnectable(element)) {
            this.connector.syncConnectorPos([element]);
          }
        }
      })
    );

    _disposables.add(
      edgeless.slots.elementRemoved.on(({ element }) => {
        this.layer.delete(
          ('flavour' in element
            ? this.edgeless.localRecord.wrap(element)
            : element) as EdgelessElement
        );
      })
    );

    _disposables.add(
      this.layer.slots.layerUpdated.on(() => {
        this._updateIndexCanvases();
      })
    );
  }

  private _getSortedSameGroupElements(element: EdgelessElement) {
    let elements: EdgelessElement[];
    const group = this.getGroupParent(element);
    if (group === GROUP_ROOT) {
      elements = this.group
        .getRootElements(
          isTopLevelBlock(element)
            ? [...this.getBlocks(NOTE), ...this.getBlocks(IMAGE)]
            : this.getElements()
        )
        .sort(this.compare);
    } else {
      elements = group.childElements.sort(this.compare);
    }
    return elements;
  }

  getIndexes(element: EdgelessElement, type: 'before' | 'after', number = 1) {
    const elements = this._getSortedSameGroupElements(element);
    const index = elements.findIndex(e => e.id === element.id);
    if (type === 'before') {
      return generateNKeysBetween(
        elements[index - 1]?.index ?? null,
        element.index,
        number
      );
    } else {
      return generateNKeysBetween(
        element.index,
        elements[index + 1]?.index ?? null,
        number
      );
    }
  }

  private _reorder = ({ elements, type }: ReorderingAction<Selectable>) => {
    elements.forEach(element => {
      const index = this.layer.getReorderedIndex(element, type);

      if (index !== element.index)
        this.updateElement(element.id, {
          index,
        });
    });
  };

  private _initEffects() {
    const { _disposables, page, edgeless } = this;
    _disposables.add(
      page.slots.blockUpdated.on(({ id, type }) => {
        if (type === 'add') {
          const model = page.getBlockById(id) as TopLevelBlockModel;
          assertExists(model);
          if (
            isNoteBlock(model) ||
            isFrameBlock(model) ||
            isImageBlock(model)
          ) {
            requestAnimationFrame(() => {
              this.fitElementToViewport(model);
            });
          }
        }
      })
    );

    _disposables.add(
      edgeless.slots.elementUpdated.on(({ id }) => {
        const element = this.pickById(id);
        assertExists(element);

        if (
          element instanceof BrushElement ||
          edgeless.selectionManager.editing
        )
          return;
        this.fitElementToViewport(element);
      })
    );

    _disposables.add(
      edgeless.slots.elementAdded.on(id => {
        const element = this.pickById(id);
        assertExists(element);
        if (element instanceof BrushElement) return;
        this.fitElementToViewport(element);
      })
    );
  }

  private _updateIndexCanvases() {
    const evt = new CustomEvent('indexedcanvasupdate', {
      detail: {
        content: this.renderCanvas(),
      },
    }) as IndexedCanvasUpdateEvent;

    this.dispatchEvent(evt);
  }

  renderCanvas() {
    /**
     * we already have a main canvas, so the last layer should be deleted
     */
    const canvasLayers = this.layer.getCanvasLayers().slice(0, -1);
    const canvases = [];
    const currentCanvases = this._indexedCanvases;

    for (let i = 0; i < canvasLayers.length; ++i) {
      const layer = canvasLayers[i];
      const created = i < currentCanvases.length;
      const canvas = created
        ? currentCanvases[i]
        : document.createElement('canvas');

      if (!created) {
        canvas.className = 'indexable-canvas';

        canvas.style.setProperty('position', 'absolute');
        canvas.style.setProperty('pointer-events', 'none');
      }

      canvas.setAttribute(
        'data-fractional',
        `${layer.indexes[0]}-${layer.indexes[1]}`
      );
      canvas.style.setProperty('z-index', layer.zIndexes.toString());

      canvases.push(canvas);
    }

    this._indexedCanvases = canvases;
    this._renderer.setIndexedCanvas(this._indexedCanvases);
    this.refresh();

    return this._indexedCanvases;
  }

  override render() {
    if (!this._isEdgeless) return nothing;

    return html`
      <div class="affine-edgeless-surface-block-container">
        <!-- attach canvas later in renderer -->
      </div>
    `;
  }

  override firstUpdated() {
    if (!this._isEdgeless) return;
    this.attach(this._surfaceContainer);
  }

  override updated() {
    if (!this._isEdgeless) return;
  }

  init() {
    this._syncFromExistingContainer();
  }

  get viewport(): Renderer {
    return this._renderer;
  }

  private _syncFromExistingContainer() {
    this.transact(() => {
      const yConnectors: Y.Map<unknown>[] = [];
      const yGroups: Y.Map<unknown>[] = [];
      this._yContainer.forEach(yElement => {
        const type = yElement.get('type') as CanvasElementType;
        if (type === 'connector') {
          yConnectors.push(yElement);
          return;
        }
        if (type === 'group') {
          yGroups.push(yElement);
          return;
        }
        this._createElementFromYMap(yElement);
      });
      yConnectors.forEach(yElement => {
        this._createElementFromYMap(yElement);
      });
      yGroups.forEach(yElement => {
        this._createElementFromYMap(yElement);
      });
    });
  }

  private _createElementFromYMap(yElement: Y.Map<unknown>) {
    const type = yElement.get('type') as CanvasElementType;
    const id = yElement.get('id') as id;
    const ElementCtor = ElementCtors[type];
    const { edgeless } = this;
    assertExists(ElementCtor);
    const element = new ElementCtor(yElement, {
      getLocalRecord: id => {
        return edgeless.localRecord.get(id);
      },
      onElementUpdated: update => {
        edgeless.slots.elementUpdated.emit(update);
      },
      updateElementLocalRecord: (id, record) => {
        edgeless.localRecord.update(id, record);
      },
      pickById: id => this.pickById(id),
      getGroupParent: (element: string | EdgelessElement) => {
        return this.getGroupParent(element);
      },
      setGroupParent: (element, group) => {
        return this.setGroupParent(element, group);
      },
      selectionManager: this.edgeless.selectionManager,
    });
    element.init();
    element.computedValue = this.getCSSPropertyValue;
    element.mount(this._renderer);
    this._elements.set(element.id, element);
    this.edgeless.slots.elementAdded.emit(id);
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
      const type = yElement.get('type') as CanvasElementType;
      const { edgeless } = this;

      const ElementCtor = ElementCtors[type];
      assertExists(ElementCtor);
      const element = new ElementCtor(yElement, {
        getLocalRecord: id => {
          return edgeless.localRecord.get(id);
        },
        onElementUpdated: update => {
          edgeless.slots.elementUpdated.emit(update);
        },
        updateElementLocalRecord: (id, record) => {
          edgeless.localRecord.update(id, record);
        },
        pickById: id => this.pickById(id),
        getGroupParent: (element: string | EdgelessElement) => {
          return this.getGroupParent(element);
        },
        setGroupParent: (element, groupId) => {
          return this.setGroupParent(element, groupId);
        },
        selectionManager: this.edgeless.selectionManager,
      });
      element.init();
      element.computedValue = this.getCSSPropertyValue;
      element.mount(this._renderer);
      this._elements.set(element.id, element);

      this.edgeless.slots.elementAdded.emit(id);
    } else if (type.action === 'update') {
      console.error('update event on yElements is not supported', event);
    } else if (type.action === 'delete') {
      const element = this._elements.get(id);
      assertExists(element);
      const group = this.pickById(this.getGroupParent(id).id);
      if (group) {
        this.group.removeChild(<GroupElement>group, id);
      }
      element.unmount();
      this._elements.delete(id);
      this.edgeless.localRecord.delete(id);
      this.edgeless.slots.elementRemoved.emit({ id, element });
    }
  };

  transact(callback: () => void) {
    const doc = this._yContainer.doc as Y.Doc;
    doc.transact(callback, doc.clientID);
  }

  refresh() {
    this._renderer.refresh();
  }

  updateIndexes(
    keys: string[],
    elements: EdgelessElement[],
    callback?: (keys: string[]) => void
  ) {
    let index, element;
    for (let i = 0; i < elements.length; i++) {
      element = elements[i];
      index = keys[i];
      if (element.index === index) continue;
      this.updateElement(element.id, { index });
    }
    callback && callback(keys);
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

  addElement<T extends CanvasElementType>(
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
  ): id {
    if (this.page.readonly) {
      throw new Error('Cannot add element in readonly mode');
    }
    if (isCanvasElementType(type)) {
      const id = generateElementId();

      const yMap = new Workspace.Y.Map();

      const defaultProps = ElementDefaultProps[type];
      const props: IElementCreateProps<typeof type> = {
        ...defaultProps,
        ...properties,
        id,
        index: this.layer.generateIndex('common', 'canvas'),
        seed: randomSeed(),
      };

      this.transact(() => {
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
      const index =
        type === EdgelessElementType.FRAME
          ? this.layer.generateIndex('frame')
          : this.layer.generateIndex('common', 'block');
      return this.page.addBlock(
        type,
        { ...properties, index },
        parent,
        parentIndex
      );
    }
  }

  updateElement<T extends CanvasElementType>(
    id: id,
    properties: IElementUpdateProps<T>
  ): void;
  updateElement(id: id, properties: Partial<BlockProps>): void;
  updateElement<T extends CanvasElementType>(
    id: id,
    properties: IElementUpdateProps<T> | Partial<BlockProps>
  ) {
    if (this.page.readonly) {
      throw new Error('Cannot update element in readonly mode');
    }
    const element = this.pickById(id);
    if (isTopLevelBlock(element)) {
      this.page.updateBlock(this.unwrap(element), properties);
    } else {
      this.transact(() => {
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

  removeElement(id: string) {
    if (this.page.readonly) {
      throw new Error('Cannot remove element in readonly mode');
    }
    const element = this.pickById(id);
    if (isTopLevelBlock(element)) {
      this.page.deleteBlock(this.unwrap(element));
    } else {
      this.transact(() => {
        this._yContainer.delete(id);
      });
    }
  }

  fitElementToViewport(ele: EdgelessElement) {
    const { viewport } = this;
    let bound = getGridBound(ele);
    bound = bound.expand(30);
    if (Date.now() - this._lastTime > 200)
      this._cachedViewport = viewport.viewportBounds;
    this._lastTime = Date.now();

    if (this._cachedViewport.contains(bound)) return;

    this._cachedViewport = this._cachedViewport.unite(bound);
    viewport.setViewportByBound(this._cachedViewport, [0, 0, 0, 0], true);
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
    if (this._elements.has(id))
      return this._elements.get(id) as EdgelessElement;

    const block = this.page.getBlockById(id);

    return block
      ? (this.edgeless.localRecord.wrap(block) as EdgelessElement)
      : null;
  }

  pickTop(
    x: number,
    y: number,
    options: { all: true }
  ): EdgelessElement[] | null;
  pickTop(
    x: number,
    y: number,
    options?: { all: false }
  ): EdgelessElement | null;
  pickTop(
    x: number,
    y: number,
    options: HitTestOptions = {
      expand: 10,
      all: false,
    }
  ): EdgelessElement[] | EdgelessElement | null {
    options.expand ??= 10;
    const hitTestBound = {
      x: x - options.expand / 2,
      y: y - options.expand / 2,
      w: options.expand,
      h: options.expand,
    };
    const pickSurface = () => {
      const candidates = this._renderer.gridManager.search(hitTestBound);
      const picked = candidates.filter(element =>
        element.hitTest(x, y, options)
      );
      return picked as EdgelessElement[];
    };
    const pickBlock = () => {
      const candidates = this.layer.blocksGrid.search(hitTestBound);
      const picked = candidates.filter(element =>
        element.hitTest(x, y, options)
      );
      return picked as EdgelessElement[];
    };
    const pickFrames = () => {
      return this.layer.frames.filter(frame =>
        frame.hitTest(x, y, options)
      ) as EdgelessElement[];
    };

    const frames = pickFrames();
    const results = pickSurface().concat(pickBlock());

    // FIXME: optimization on ordered element
    results.sort(compare);

    if (results.length === 0) {
      return options.all ? frames : last(frames) ?? null;
    }

    return options.all ? frames.concat(results) : last(results) ?? null;
  }

  pickTopWithGroup(point: IVec, options?: HitTestOptions) {
    const selectionManager = this.edgeless.selectionManager;
    const results = this.pickTop(point[0], point[1], {
      ...options,
      all: true,
    }) as EdgelessElement[];

    let picked = last(results) ?? null;
    const first = picked;
    if (selectionManager.activeGroup) {
      let index = results.length - 1;
      while (
        picked === selectionManager.activeGroup ||
        (picked instanceof GroupElement &&
          isDescendant(selectionManager.activeGroup, picked))
      ) {
        picked = results[--index];
      }
    } else if (picked) {
      let index = results.length - 1;
      while (this.getGroupParent(picked.id) !== GROUP_ROOT) {
        if (--index < 0) {
          picked = null;
          break;
        }
        picked = results[index];
      }
    }

    return picked ?? first;
  }

  pickByBound(bound: Bound): EdgelessElement[] {
    const candidates = [
      ...this._renderer.gridManager.search(bound),
      ...this.blocks,
    ];
    const picked = candidates.filter(
      element =>
        element.boxSelect(bound) &&
        this.getGroupParent(element.id) === GROUP_ROOT
    );
    return picked;
  }

  /**
   * Block model retrieved from the surface block will be wrapped with local record.
   * You can use this function to unwrap them to get real model
   * @param block
   * @returns
   */
  unwrap<T extends BaseBlockModel>(block: T) {
    return this.edgeless.localRecord.unwrap(block) as T;
  }

  getSortedCanvasElementsWithViewportBounds() {
    return this.pickByBound(this.viewport.viewportBounds)
      .filter(e => !isTopLevelBlock(e))
      .sort(this.compare);
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

  getElementsByType<T extends keyof ICanvasElementType>(
    type: T
  ): ICanvasElementType[T][] {
    return this.getElements().filter(
      element => element.type === type
    ) as unknown as ICanvasElementType[T][];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-surface': SurfaceBlockComponent;
  }
}
