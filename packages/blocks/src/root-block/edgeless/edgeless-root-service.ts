import type { BlockStdScope } from '@blocksuite/block-std';
import type {
  GfxController,
  GfxModel,
  LayerManager,
  PointTestOptions,
  ReorderingDirection,
} from '@blocksuite/block-std/gfx';

import {
  type ElementRenderer,
  elementRenderers,
  type SurfaceBlockModel,
  type SurfaceContext,
} from '@blocksuite/affine-block-surface';
import {
  type ConnectorElementModel,
  type FrameBlockModel,
  type GroupElementModel,
  MindmapElementModel,
  RootBlockSchema,
} from '@blocksuite/affine-model';
import { EditPropsStore } from '@blocksuite/affine-shared/services';
import { clamp } from '@blocksuite/affine-shared/utils';
import {
  GfxControllerIdentifier,
  GfxExtensionIdentifier,
  isGfxGroupCompatibleModel,
} from '@blocksuite/block-std/gfx';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { Bound, getCommonBound } from '@blocksuite/global/utils';
import { type BlockModel, Slot } from '@blocksuite/store';
import { effect } from '@preact/signals-core';

import type { EdgelessFrameManager } from './frame-manager.js';

import { getSurfaceBlock } from '../../surface-ref-block/utils.js';
import { RootService } from '../root-service.js';
import { GfxBlockModel } from './block-model.js';
import { TemplateJob } from './services/template.js';
import {
  createInsertPlaceMiddleware,
  createRegenerateIndexMiddleware,
  createStickerMiddleware,
  replaceIdMiddleware,
} from './services/template-middlewares.js';
import { FIT_TO_SCREEN_PADDING } from './utils/consts.js';
import { getLastPropsKey } from './utils/get-last-props-key.js';
import { getCursorMode } from './utils/query.js';
import {
  ZOOM_INITIAL,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  type ZoomAction,
} from './utils/zoom.js';

export class EdgelessRootService extends RootService implements SurfaceContext {
  static override readonly flavour = RootBlockSchema.model.flavour;

  private _surface: SurfaceBlockModel;

  elementRenderers: Record<string, ElementRenderer> = elementRenderers;

  slots = {
    pressShiftKeyUpdated: new Slot<boolean>(),
    copyAsPng: new Slot<{
      blocks: BlockSuite.EdgelessBlockModelType[];
      shapes: BlockSuite.SurfaceModel[];
    }>(),
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

    toolbarLocked: new Slot<boolean>(),
  };

  TemplateJob = TemplateJob;

  updateElement = (id: string, props: Record<string, unknown>) => {
    const element = this._surface.getElementById(id);
    if (element) {
      const key = getLastPropsKey(
        element.type as BlockSuite.EdgelessModelKeys,
        { ...element.yMap.toJSON(), ...props }
      );
      key && this.std.get(EditPropsStore).recordLastProps(key, props);
      this._surface.updateElement(id, props);
      return;
    }

    const block = this.doc.getBlockById(id);
    if (block) {
      const key = getLastPropsKey(
        block.flavour as BlockSuite.EdgelessModelKeys,
        { ...block.yBlock.toJSON(), ...props }
      );
      key && this.std.get(EditPropsStore).recordLastProps(key, props);
      this.doc.updateBlock(block, props);
    }
  };

  get blocks(): GfxBlockModel[] {
    return this.layer.blocks;
  }

  /**
   * sorted edgeless elements
   */
  get edgelessElements(): GfxModel[] {
    return [...this.layer.canvasElements, ...this.layer.blocks].sort(
      this.layer.compare
    );
  }

  /**
   * sorted canvas elements
   */
  get elements() {
    return this.layer.canvasElements;
  }

  get frame() {
    return this.std.get(
      GfxExtensionIdentifier('frame-manager')
    ) as EdgelessFrameManager;
  }

  /**
   * Get all sorted frames by presentation orderer,
   * the legacy frame that uses `index` as presentation order
   * will be put at the beginning of the array.
   */
  get frames() {
    return this.frame.frames;
  }

  get gfx(): GfxController {
    return this.std.get(GfxControllerIdentifier);
  }

  override get host() {
    return this.std.host;
  }

  get layer(): LayerManager {
    return this.gfx.layer;
  }

  get locked() {
    return this.viewport.locked;
  }

  set locked(locked: boolean) {
    this.viewport.locked = locked;
  }

  get selection() {
    return this.gfx.selection;
  }

  get surface() {
    return this._surface;
  }

  get viewport() {
    return this.std.get(GfxControllerIdentifier).viewport;
  }

  get zoom() {
    return this.viewport.zoom;
  }

  constructor(std: BlockStdScope, flavourProvider: { flavour: string }) {
    super(std, flavourProvider);
    const surface = getSurfaceBlock(this.doc);
    if (!surface) {
      throw new BlockSuiteError(
        ErrorCode.NoSurfaceModelError,
        'This doc is missing surface block in edgeless.'
      );
    }
    this._surface = surface;
  }

  private _initReadonlyListener() {
    const doc = this.doc;

    let readonly = doc.readonly;
    this.disposables.add(
      doc.awarenessStore.slots.update.on(() => {
        if (readonly !== doc.readonly) {
          readonly = doc.readonly;
          this.slots.readonlyUpdated.emit(readonly);
        }
      })
    );
  }

  private _initSlotEffects() {
    const { disposables } = this;

    disposables.add(
      effect(() => {
        const value = this.gfx.tool.currentToolOption$.value;
        this.gfx.cursor$.value = getCursorMode(value);
      })
    );
  }

  addBlock(
    flavour: string,
    props: Record<string, unknown>,
    parent?: string | BlockModel,
    parentIndex?: number
  ) {
    const key = getLastPropsKey(flavour as BlockSuite.EdgelessModelKeys, props);
    if (key) {
      props = this.std.get(EditPropsStore).applyLastProps(key, props);
    }

    const nProps = {
      ...props,
      index: this.generateIndex(),
    };
    return this.doc.addBlock(flavour as never, nProps, parent, parentIndex);
  }

  addElement<T extends Record<string, unknown>>(type: string, props: T) {
    const key = getLastPropsKey(type as BlockSuite.EdgelessModelKeys, props);
    if (key) {
      props = this.std.get(EditPropsStore).applyLastProps(key, props) as T;
    }

    const nProps = {
      ...props,
      type,
      index: props.index ?? this.generateIndex(),
    };
    const id = this._surface.addElement(nProps);
    return id;
  }

  createGroup(elements: BlockSuite.EdgelessModel[] | string[]) {
    const groups = this.elements.filter(
      el => el.type === 'group'
    ) as GroupElementModel[];
    const groupId = this.addElement('group', {
      children: elements.reduce(
        (pre, el) => {
          const id = typeof el === 'string' ? el : el.id;
          pre[id] = true;
          return pre;
        },
        {} as Record<string, true>
      ),
      title: `Group ${groups.length + 1}`,
    });

    return groupId;
  }

  /**
   * Create a group from selected elements, if the selected elements are in the same group
   * @returns the id of the created group
   */
  createGroupFromSelected() {
    const { selection } = this;

    if (
      selection.selectedElements.length === 0 ||
      !selection.selectedElements.every(
        element =>
          element.group === selection.firstElement.group &&
          !(element.group instanceof MindmapElementModel)
      )
    ) {
      return;
    }

    const parent = selection.firstElement.group as GroupElementModel;

    if (parent !== null) {
      selection.selectedElements.forEach(element => {
        // eslint-disable-next-line unicorn/prefer-dom-node-remove
        parent.removeChild(element);
      });
    }

    const groupId = this.createGroup(selection.selectedElements);
    const group = this.surface.getElementById(groupId);

    if (parent !== null && group) {
      parent.addChild(group);
    }

    selection.set({
      editing: false,
      elements: [groupId],
    });

    return groupId;
  }

  createTemplateJob(
    type: 'template' | 'sticker',
    center?: { x: number; y: number }
  ) {
    const middlewares: ((job: TemplateJob) => void)[] = [];

    if (type === 'template') {
      const bounds = [...this.blocks, ...this.elements].map(i =>
        Bound.deserialize(i.xywh)
      );
      const currentContentBound = getCommonBound(bounds);

      if (currentContentBound) {
        currentContentBound.x +=
          currentContentBound.w + 20 / this.viewport.zoom;
        middlewares.push(createInsertPlaceMiddleware(currentContentBound));
      }

      const idxGenerator = this.layer.createIndexGenerator();

      middlewares.push(createRegenerateIndexMiddleware(() => idxGenerator()));
    }

    if (type === 'sticker') {
      middlewares.push(
        createStickerMiddleware(center || this.viewport.center, () =>
          this.layer.generateIndex()
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

  generateIndex() {
    return this.layer.generateIndex();
  }

  getConnectors(element: BlockSuite.EdgelessModel | string) {
    const id = typeof element === 'string' ? element : element.id;

    return this.surface.getConnectors(id) as ConnectorElementModel[];
  }

  getElementById(id: string): BlockSuite.EdgelessModel | null {
    const el =
      this._surface.getElementById(id) ??
      (this.doc.getBlockById(id) as BlockSuite.EdgelessBlockModelType | null);
    return el;
  }

  getElementsByType<K extends keyof BlockSuite.SurfaceElementModelMap>(
    type: K
  ): BlockSuite.SurfaceElementModelMap[K][] {
    return this.surface.getElementsByType(type);
  }

  getFitToScreenData(
    padding: [number, number, number, number] = [0, 0, 0, 0],
    inputBounds?: Bound[]
  ) {
    let bounds = [];
    if (inputBounds && inputBounds.length) {
      bounds = inputBounds;
    } else {
      this.blocks.forEach(block => {
        bounds.push(Bound.deserialize(block.xywh));
      });

      const surfaceElementsBound = getCommonBound(this.elements);
      if (surfaceElementsBound) {
        bounds.push(surfaceElementsBound);
      }
    }

    const bound = getCommonBound(bounds);

    return this.viewport.getFitToScreenData(
      bound,
      padding,
      ZOOM_INITIAL,
      FIT_TO_SCREEN_PADDING
    );
  }

  override mounted() {
    super.mounted();
    this._initSlotEffects();
    this._initReadonlyListener();
  }

  /**
   * This method is used to pick element in group, if the picked element is in a
   * group, we will pick the group instead. If that picked group is currently selected, then
   * we will pick the element itself.
   */
  pickElementInGroup(
    x: number,
    y: number,
    options?: PointTestOptions
  ): BlockSuite.EdgelessModel | null {
    return this.gfx.getElementInGroup(x, y, options);
  }

  removeElement(id: string | BlockSuite.EdgelessModel) {
    id = typeof id === 'string' ? id : id.id;

    const el = this.getElementById(id);
    if (isGfxGroupCompatibleModel(el)) {
      el.childIds.forEach(childId => {
        this.removeElement(childId);
      });
    }

    if (el instanceof GfxBlockModel) {
      this.doc.deleteBlock(el);
      return;
    }

    if (this._surface.hasElementById(id)) {
      this._surface.deleteElement(id);
      return;
    }
  }

  reorderElement(
    element: BlockSuite.EdgelessModel,
    direction: ReorderingDirection
  ) {
    const index = this.layer.getReorderedIndex(element, direction);

    // block should be updated in transaction
    if (element instanceof GfxBlockModel) {
      this.doc.transact(() => {
        element.index = index;
      });
    } else {
      element.index = index;
    }
  }

  setZoomByAction(action: ZoomAction) {
    if (this.locked) return;

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

  setZoomByStep(step: number) {
    this.viewport.smoothZoom(clamp(this.zoom + step, ZOOM_MIN, ZOOM_MAX));
  }

  ungroup(group: GroupElementModel) {
    const { selection } = this;
    const elements = group.childElements;
    const parent = group.group as GroupElementModel;

    if (group instanceof MindmapElementModel) {
      return;
    }

    if (parent !== null) {
      // eslint-disable-next-line unicorn/prefer-dom-node-remove
      parent.removeChild(group);
    }

    elements.forEach(element => {
      // eslint-disable-next-line unicorn/prefer-dom-node-remove
      group.removeChild(element);
    });

    // keep relative index order of group children after ungroup
    elements
      .sort((a, b) => this.layer.compare(a, b))
      .forEach(element => {
        this.doc.transact(() => {
          element.index = this.layer.generateIndex();
        });
      });

    if (parent !== null) {
      elements.forEach(element => {
        parent.addChild(element);
      });
    }

    selection.set({
      editing: false,
      elements: elements.map(ele => ele.id),
    });
  }

  override unmounted() {
    super.unmounted();

    this.viewport?.dispose();
    this.selectionManager.set([]);
    this.disposables.dispose();
  }

  zoomToFit() {
    const { centerX, centerY, zoom } = this.getFitToScreenData();
    this.viewport.setViewport(zoom, [centerX, centerY], true);
  }
}
