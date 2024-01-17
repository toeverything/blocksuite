import { type BlockModel } from '@blocksuite/store';

import { last } from '../../_common/utils/iterable.js';
import type { CanvasElementType } from '../../index.js';
import { GroupElementModel } from '../../index.js';
import type { SurfaceBlockModel } from '../../models.js';
import type { IBound } from '../../surface-block/consts.js';
import type { ReorderingDirection } from '../../surface-block/managers/layer-manager.js';
import { LayerManager } from '../../surface-block/managers/layer-manager.js';
import { Bound } from '../../surface-block/utils/bound.js';
import { PageService } from '../page-service.js';
import { EdgelessSelectionManager } from './services/selection-manager.js';
import type { EdgelessBlock, EdgelessElement, HitTestOptions } from './type.js';
import { Viewport } from './utils/viewport.js';

export class EdgelessPageService extends PageService {
  private _surfaceModel!: SurfaceBlockModel;
  private _layer!: LayerManager;
  private _selection!: EdgelessSelectionManager;
  private _viewport!: Viewport;

  override mounted() {
    super.mounted();

    this._surfaceModel = this.page.getBlockByFlavour(
      'affine:surface'
    )[0] as SurfaceBlockModel;

    if (!this._surfaceModel) {
      throw new Error('surface block not found');
    }

    this._layer = LayerManager.create(this.page, this._surfaceModel);
    this._viewport = new Viewport();
    this._selection = new EdgelessSelectionManager(this);
    this.editSession.listen(this._surfaceModel);
  }

  override unmounted() {
    super.unmounted();
    this._layer.dispose();
    this._selection.dispose();
    this.selectionManager.set([]);
  }

  get surface() {
    return this._surfaceModel;
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

  get elements() {
    return this._layer.canvasElements;
  }

  get frames() {
    return this._layer.frames;
  }

  get blocks() {
    return (this.frames as EdgelessBlock[]).concat(this._layer.blocks);
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

    return this._surfaceModel.addElement(props as T & { type: string });
  }

  addBlock(
    flavour: string,
    props: Record<string, unknown>,
    parent?: string | BlockModel,
    parentIndex?: number
  ) {
    props['index'] = this.generateIndex(flavour);

    return this.page.addBlock(flavour, props, parent, parentIndex);
  }

  updateElement(id: string, props: Record<string, unknown>) {
    if (this._surfaceModel.getElementById(id)) {
      this._surfaceModel.updateElement(id, props);
    } else if (this.page.getBlockById(id)) {
      const block = this.page.getBlockById(id)!;
      this.page.updateBlock(block, props);
    }
  }

  removeElement(id: string | EdgelessElement) {
    id = typeof id === 'string' ? id : id.id;

    if (this._surfaceModel.getElementById(id)) {
      this._surfaceModel.removeElement(id);
    } else if (this.page.getBlockById(id)) {
      const block = this.page.getBlockById(id)!;

      this.page.deleteBlock(block);
    }
  }

  getElementById(id: string) {
    return (
      this._surfaceModel.getElementById(id) ??
      (this.page.getBlockById(id) as EdgelessBlock)
    );
  }

  pickElement(x: number, y: number, options: { all: true }): EdgelessElement[];
  pickElement(
    x: number,
    y: number,
    options?: { all: false }
  ): EdgelessElement | null;
  pickElement(
    x: number,
    y: number,
    options: HitTestOptions = { all: false, expand: 10 }
  ): EdgelessElement[] | EdgelessElement | null {
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
      const picked = candidates.filter(element =>
        element.hitTest(x, y, options)
      );
      return picked as EdgelessElement[];
    };
    const pickBlock = () => {
      const candidates = this._layer.blocksGrid.search(hitTestBound);
      const picked = candidates.filter(element =>
        element.hitTest(x, y, options)
      );
      return picked as EdgelessElement[];
    };
    const pickFrames = () => {
      return this._layer.frames.filter(frame =>
        frame.hitTest(x, y, options)
      ) as EdgelessElement[];
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

  pickElementsByBound(bound: IBound | Bound, type?: 'all'): EdgelessElement[];
  pickElementsByBound(bound: IBound | Bound, type: 'blocks'): EdgelessBlock[];
  pickElementsByBound(
    bound: IBound | Bound,
    type: 'frame' | 'blocks' | 'canvas' | 'all' = 'all'
  ): EdgelessElement[] {
    bound = new Bound(bound.x, bound.y, bound.w, bound.h);

    const pickCanvasElement = () => {
      const candidates = this._layer.canvasGrid.search(bound);
      const picked = candidates.filter(element =>
        element.boxSelect(bound as Bound)
      );
      return picked as EdgelessElement[];
    };
    const pickBlock = () => {
      const candidates = this._layer.blocksGrid.search(bound);
      const picked = candidates.filter(element =>
        element.boxSelect(bound as Bound)
      );
      return picked as EdgelessElement[];
    };
    const pickFrames = () => {
      const candidates = this._layer.framesGrid.search(bound);
      return candidates.filter(frame =>
        frame.boxSelect(bound as Bound)
      ) as EdgelessElement[];
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
  ): EdgelessElement | null {
    const selectionManager = this._selection;
    const results = this.pickElement(x, y, {
      ...options,
      all: true,
    }) as EdgelessElement[];

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

    return (picked ?? first) as EdgelessElement | null;
  }

  toModelCoord(viewX: number, viewY: number): [number, number] {
    const { viewportX, viewportY, zoom } = this._viewport;
    return [viewportX + viewX / zoom, viewportY + viewY / zoom];
  }

  toViewCoord(modelX: number, modelY: number): [number, number] {
    const { viewportX, viewportY, zoom } = this._viewport;
    return [(modelX - viewportX) * zoom, (modelY - viewportY) * zoom];
  }

  toViewBound(bound: Bound) {
    const { w, h } = bound;
    const [x, y] = this.toViewCoord(bound.x, bound.y);

    return new Bound(x, y, w * this._viewport.zoom, h * this._viewport.zoom);
  }

  reorderElement(element: EdgelessElement, direction: ReorderingDirection) {
    const index = this._layer.getReorderedIndex(element, direction);

    element.index = index;
  }

  createGroup(elements: EdgelessElement[] | string[]) {
    const groups = this.elements.filter(
      el => el.type === 'group'
    ) as GroupElementModel[];
    const groupId = this._surfaceModel.addElement({
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

  releaseFromGroup(element: EdgelessElement) {
    if (element.group === null) return;

    const group = element.group;

    group.removeChild(element.id);

    element.index = this.layer.generateIndex(
      'flavour' in element ? element.flavour : element.type
    );

    const parent = group.group;
    if (parent != null) {
      parent.addChild(element.id);
    }
  }

  getConnectedElements(element: EdgelessElement) {
    return this.surface.getConnectors(element.id).reduce((prev, current) => {
      if (current.target.id === element.id && current.source.id) {
        prev.push(this.getElementById(current.source.id));
      }
      if (current.source.id === element.id && current.target.id) {
        prev.push(this.getElementById(current.target.id));
      }

      return prev;
    }, [] as EdgelessElement[]);
  }

  getConnectors(element: EdgelessElement) {
    return this.surface.getConnectors(element.id);
  }
}
