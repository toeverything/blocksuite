import { assertExists } from '@blocksuite/global/utils';
import { type BlockModel, Slot } from '@blocksuite/store';

import type { EdgelessTool, TopLevelBlockModel } from '../../_common/types.js';
import { last } from '../../_common/utils/iterable.js';
import { clamp } from '../../_common/utils/math.js';
import type { FrameBlockModel, SurfaceBlockModel } from '../../models.js';
import type { IBound } from '../../surface-block/consts.js';
import type { EdgelessElementType } from '../../surface-block/edgeless-types.js';
import type {
  CanvasElement,
  CanvasElementType,
  ConnectorElementModel,
} from '../../surface-block/element-model/index.js';
import {
  getCommonBound,
  GroupElementModel,
} from '../../surface-block/index.js';
import type { ReorderingDirection } from '../../surface-block/managers/layer-manager.js';
import { LayerManager } from '../../surface-block/managers/layer-manager.js';
import { Bound } from '../../surface-block/utils/bound.js';
import { PageService } from '../page-service.js';
import { EdgelessFrameManager } from './frame-manager.js';
import { EdgelessSelectionManager } from './services/selection-manager.js';
import { TemplateJob } from './services/template.js';
import {
  createInsertPlaceMiddleware,
  createRegenerateIndexMiddleware,
  createStickerMiddleware,
  replaceIdMiddleware,
} from './services/template-middlewares.js';
import type { EdgelessToolConstructor } from './services/tools-manager.js';
import { EdgelessToolsManager } from './services/tools-manager.js';
import type {
  EdgelessBlockModel,
  EdgelessModel,
  HitTestOptions,
} from './type.js';
import { FIT_TO_SCREEN_PADDING } from './utils/consts.js';
import { getCursorMode } from './utils/query.js';
import { EdgelessSnapManager } from './utils/snap-manager.js';
import {
  Viewport,
  ZOOM_INITIAL,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  type ZoomAction,
} from './utils/viewport.js';

export class EdgelessPageService extends PageService {
  TemplateJob = TemplateJob;

  slots = {
    edgelessToolUpdated: new Slot<EdgelessTool>(),
    pressShiftKeyUpdated: new Slot<boolean>(),
    cursorUpdated: new Slot<string>(),
    copyAsPng: new Slot<{
      blocks: TopLevelBlockModel[];
      shapes: CanvasElement[];
    }>(),
    pageLinkClicked: new Slot<{ pageId: string; blockId?: string }>(),
    readonlyUpdated: new Slot<boolean>(),
    draggingAreaUpdated: new Slot(),
    navigatorSettingUpdated: new Slot<{
      hideToolbar?: boolean;
      blackBackground?: boolean;
      fillScreen?: boolean;
    }>(),
    navigatorFrameChanged: new Slot<FrameBlockModel>(),
    fullScreenToggled: new Slot(),

    elementResizeStart: new Slot(),
    elementResizeEnd: new Slot(),
    toggleNoteSlicer: new Slot(),
  };

  private _surface!: SurfaceBlockModel;
  private _layer!: LayerManager;
  private _frame!: EdgelessFrameManager;
  private _snap!: EdgelessSnapManager;
  private _selection!: EdgelessSelectionManager;
  private _viewport!: Viewport;
  private _tool!: EdgelessToolsManager;

  override mounted() {
    super.mounted();

    this._surface = this.page.getBlockByFlavour(
      'affine:surface'
    )[0] as SurfaceBlockModel;

    if (!this._surface) {
      throw new Error('surface block not found');
    }

    this._layer = LayerManager.create(this.page, this._surface);
    this._frame = new EdgelessFrameManager(this);
    this._snap = new EdgelessSnapManager(this);
    this._viewport = new Viewport();
    this._selection = new EdgelessSelectionManager(this);
    this._tool = EdgelessToolsManager.create(this, []);

    this._initSlotEffects();
    this._initReadonlyListener();
  }

  override unmounted() {
    super.unmounted();
    this._layer.dispose();
    this._selection.dispose();
    this.selectionManager.set([]);
    this.viewport.dispose();
    this.tool.dispose();
    this.disposables.dispose();
  }

  get tool() {
    return this._tool;
  }

  get surface() {
    return this._surface;
  }

  get layer() {
    return this._layer;
  }

  get selection() {
    return this._selection;
  }

  get viewport() {
    return this._viewport;
  }

  get frame() {
    return this._frame;
  }

  get snap() {
    return this._snap;
  }

  /**
   * sorted canvas elements
   */
  get elements() {
    return this._layer.canvasElements;
  }

  get frames() {
    return this._layer.frames;
  }

  get blocks() {
    return (this.frames as EdgelessBlockModel[]).concat(this._layer.blocks);
  }

  get zoom() {
    return this.viewport.zoom;
  }

  private _initSlotEffects() {
    const { disposables, slots } = this;

    disposables.add(
      slots.edgelessToolUpdated.on(edgelessTool => {
        slots.cursorUpdated.emit(getCursorMode(edgelessTool));
        if (!this.std.event.isActive) this.std.event.activate();
      })
    );

    disposables.add(
      slots.pressShiftKeyUpdated.on(pressed => {
        this.tool.shiftKey = pressed;
      })
    );
  }

  private _initReadonlyListener() {
    const page = this.page;

    let readonly = page.readonly;
    this.disposables.add(
      page.awarenessStore.slots.update.on(() => {
        if (readonly !== page.readonly) {
          readonly = page.readonly;
          this.slots.readonlyUpdated.emit(readonly);
        }
      })
    );
  }

  generateIndex(type: string) {
    // @ts-ignore
    return this._layer.generateIndex(type);
  }

  addElement<T = Record<string, unknown>>(type: string, props: T) {
    // @ts-ignore
    props['index'] = this.generateIndex(type);
    // @ts-ignore
    props['type'] = type;

    this.editSession.apply(
      type as CanvasElementType,
      props as Record<string, unknown>
    );

    return this._surface.addElement(props as T & { type: string });
  }

  addBlock(
    flavour: string,
    props: Record<string, unknown>,
    parent?: string | BlockModel,
    parentIndex?: number
  ) {
    props['index'] = this.generateIndex(flavour);

    this.editSession.apply(flavour as EdgelessElementType, props);

    return this.page.addBlock(flavour, props, parent, parentIndex);
  }

  getElementsByType<
    K extends Parameters<SurfaceBlockModel['getElementsByType']>[0],
  >(type: K) {
    return this.surface.getElementsByType(type);
  }

  updateElement(id: string, props: Record<string, unknown>) {
    if (this._surface.getElementById(id)) {
      const element = this._surface.getElementById(id)!;
      this.editSession.record(element.type as EdgelessElementType, props);
      this._surface.updateElement(id, props);
    } else if (this.page.getBlockById(id)) {
      const block = this.page.getBlockById(id)!;

      this.editSession.record(block.flavour as EdgelessElementType, props);
      this.page.updateBlock(block, props);
    }
  }

  removeElement(id: string | EdgelessModel) {
    id = typeof id === 'string' ? id : id.id;

    if (this._surface.getElementById(id)) {
      this._surface.removeElement(id);
    } else if (this.page.getBlockById(id)) {
      const block = this.page.getBlockById(id)!;

      this.page.deleteBlock(block);
    }
  }

  getElementById(id: string) {
    return (
      this._surface.getElementById(id) ??
      (this.page.getBlockById(id) as EdgelessBlockModel)
    );
  }

  pickElement(x: number, y: number, options: { all: true }): EdgelessModel[];
  pickElement(
    x: number,
    y: number,
    options?: { all: false }
  ): EdgelessModel | null;
  pickElement(
    x: number,
    y: number,
    options: HitTestOptions = { all: false, expand: 10 }
  ): EdgelessModel[] | EdgelessModel | null {
    options.expand ??= 10;
    options.zoom = this._viewport.zoom;

    const hitTestBound = {
      x: x - options.expand / 2,
      y: y - options.expand / 2,
      w: options.expand,
      h: options.expand,
    };
    const pickCanvasElement = () => {
      const candidates = this._layer.canvasGrid.search(hitTestBound);
      const picked = candidates.filter(
        element =>
          element.hitTest(x, y, options) ||
          element.externalBound?.isPointInBound([x, y])
      );
      return picked as EdgelessModel[];
    };
    const pickBlock = () => {
      const candidates = this._layer.blocksGrid.search(hitTestBound);
      const picked = candidates.filter(
        element =>
          element.hitTest(x, y, options) ||
          element.externalBound?.isPointInBound([x, y])
      );
      return picked as EdgelessModel[];
    };
    const pickFrames = () => {
      return this._layer.frames.filter(
        frame =>
          frame.hitTest(x, y, options) ||
          frame.externalBound?.isPointInBound([x, y])
      ) as EdgelessModel[];
    };

    let results = pickCanvasElement().concat(pickBlock());

    // FIXME: optimazation on ordered element
    results.sort(this._layer.compare);

    if (options.all || results.length === 0) {
      const frames = pickFrames();

      results = frames.concat(results);
    }

    return options.all ? results : last(results) ?? null;
  }

  pickElementsByBound(bound: IBound | Bound, type?: 'all'): EdgelessModel[];
  pickElementsByBound(
    bound: IBound | Bound,
    type: 'blocks'
  ): EdgelessBlockModel[];
  pickElementsByBound(
    bound: IBound | Bound,
    type: 'frame' | 'blocks' | 'canvas' | 'all' = 'all'
  ): EdgelessModel[] {
    bound = new Bound(bound.x, bound.y, bound.w, bound.h);

    const pickCanvasElement = () => {
      const candidates = this._layer.canvasGrid.search(bound);
      const picked = candidates.filter(element =>
        element.boxSelect(bound as Bound)
      );
      return picked as EdgelessModel[];
    };
    const pickBlock = () => {
      const candidates = this._layer.blocksGrid.search(bound);
      const picked = candidates.filter(element =>
        element.boxSelect(bound as Bound)
      );
      return picked as EdgelessModel[];
    };
    const pickFrames = () => {
      const candidates = this._layer.framesGrid.search(bound);
      return candidates.filter(frame =>
        frame.boxSelect(bound as Bound)
      ) as EdgelessModel[];
    };

    switch (type) {
      case 'canvas':
        return pickCanvasElement();
      case 'blocks':
        return pickFrames().concat(pickBlock());
      case 'frame':
        return pickFrames();
      case 'all': {
        const results = pickCanvasElement().concat(pickBlock());
        results.sort(this._layer.compare);
        return pickFrames().concat(results);
      }
    }
  }

  /**
   * This method is used to pick element in group, if the picked element is in a
   * group, we will pick the group instead. If that picked group is currently selected, then
   * we will pick the element itself.
   */
  pickElementInGroup(
    x: number,
    y: number,
    options?: HitTestOptions
  ): EdgelessModel | null {
    const selectionManager = this._selection;
    const results = this.pickElement(x, y, {
      ...options,
      all: true,
    }) as EdgelessModel[];

    let picked = last(results) ?? null;
    const { activeGroup } = selectionManager;
    const first = picked;

    if (activeGroup && picked && activeGroup.hasDescendant(picked.id)) {
      let index = results.length - 1;
      while (
        picked === activeGroup ||
        (picked instanceof GroupElementModel &&
          picked.hasDescendant(activeGroup))
      ) {
        picked = results[--index];
      }
    } else if (picked) {
      let index = results.length - 1;
      while (picked.group !== null) {
        if (--index < 0) {
          picked = null;
          break;
        }
        picked = results[index];
      }
    }

    return (picked ?? first) as EdgelessModel | null;
  }

  reorderElement(element: EdgelessModel, direction: ReorderingDirection) {
    const index = this._layer.getReorderedIndex(element, direction);

    element.index = index;
  }

  createGroup(elements: EdgelessModel[] | string[]) {
    const groups = this.elements.filter(
      el => el.type === 'group'
    ) as GroupElementModel[];
    const groupId = this._surface.addElement({
      type: 'group',
      children: elements.reduce(
        (pre, el) => {
          const id = typeof el === 'string' ? el : el.id;
          pre[id] = true;
          return pre;
        },
        {} as { [id: string]: true }
      ),
      title: `Group ${groups.length + 1}`,
    });

    return groupId;
  }

  createGroupFromSelected() {
    const { selection } = this;

    if (
      selection.elements.length <= 0 ||
      !selection.elements.every(
        element => element.group === selection.firstElement.group
      )
    ) {
      return;
    }

    const parent = selection.firstElement.group;

    if (parent !== null) {
      selection.elements.forEach(element => {
        parent.removeChild(element.id);
      });
    }

    const groupId = this.createGroup(selection.elements);

    if (parent !== null) {
      parent.addChild(groupId);
    }

    selection.set({
      editing: false,
      elements: [groupId],
    });

    return groupId;
  }

  ungroup(group: GroupElementModel) {
    const { selection } = this;
    const elements = group.childElements;
    const parent = group.group;

    if (parent !== null) {
      parent.removeChild(group.id);
    }

    elements.forEach(element => {
      // @ts-ignore
      const elementType = element.type || element.flavour;

      element.index = this.generateIndex(elementType);
    });

    this.removeElement(group.id);

    if (parent !== null) {
      elements.forEach(element => {
        parent.addChild(element.id);
      });
    }

    selection.set({
      editing: false,
      elements: elements.map(ele => ele.id),
    });
  }

  registerTool(Tool: EdgelessToolConstructor) {
    return this.tool.register(Tool);
  }

  getConnectors(element: EdgelessModel | string) {
    const id = typeof element === 'string' ? element : element.id;

    return this.surface.getConnectors(id) as ConnectorElementModel[];
  }

  createTemplateJob(type: 'template' | 'sticker') {
    const middlewares: ((job: TemplateJob) => void)[] = [];

    if (type === 'template') {
      const currentContentBound = getCommonBound(
        (
          this.blocks.map(block => Bound.deserialize(block.xywh)) as IBound[]
        ).concat(this.elements)
      );

      if (currentContentBound) {
        currentContentBound.x +=
          currentContentBound.w + 20 / this.viewport.zoom;
        middlewares.push(createInsertPlaceMiddleware(currentContentBound));
      }

      const idxGenerator = this.layer.createIndexGenerator(true);

      middlewares.push(
        createRegenerateIndexMiddleware((type: string) => idxGenerator(type))
      );
    }

    if (type === 'sticker') {
      middlewares.push(
        createStickerMiddleware(this.viewport.center, () =>
          this.layer.generateIndex('affine:image')
        )
      );
    }

    middlewares.push(replaceIdMiddleware);

    return TemplateJob.create({
      model: this.surface,
      type,
      middlewares,
    });
  }

  setZoomByStep(step: number) {
    this.viewport.smoothZoom(clamp(this.zoom + step, ZOOM_MIN, ZOOM_MAX));
  }

  zoomToFit() {
    const { centerX, centerY, zoom } = this.getFitToScreenData();
    this.viewport.setViewport(zoom, [centerX, centerY], true);
  }

  getFitToScreenData(padding: [number, number, number, number] = [0, 0, 0, 0]) {
    const bounds = [];

    this.blocks.forEach(block => {
      bounds.push(Bound.deserialize(block.xywh));
    });

    const surfaceElementsBound = getCommonBound(this.elements);
    if (surfaceElementsBound) {
      bounds.push(surfaceElementsBound);
    }

    const [pt, pr, pb, pl] = padding;
    const { viewport } = this;
    let { centerX, centerY, zoom } = viewport;

    if (bounds.length) {
      const { width, height } = viewport;
      const bound = getCommonBound(bounds);
      assertExists(bound);

      zoom = Math.min(
        (width - FIT_TO_SCREEN_PADDING - (pr + pl)) / bound.w,
        (height - FIT_TO_SCREEN_PADDING - (pt + pb)) / bound.h
      );
      zoom = clamp(zoom, ZOOM_MIN, ZOOM_INITIAL);

      centerX = bound.x + (bound.w + pr / zoom) / 2 - pl / zoom / 2;
      centerY = bound.y + (bound.h + pb / zoom) / 2 - pt / zoom / 2;
    } else {
      zoom = ZOOM_INITIAL;
    }
    return { zoom, centerX, centerY };
  }

  setZoomByAction(action: ZoomAction) {
    switch (action) {
      case 'fit':
        this.zoomToFit();
        break;
      case 'reset':
        this.viewport.smoothZoom(1.0);
        break;
      case 'in':
      case 'out':
        this.setZoomByStep(ZOOM_STEP * (action === 'in' ? 1 : -1));
    }
  }
}
