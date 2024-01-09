import type { BlockModel } from '@blocksuite/store';

import { last } from '../../_common/utils/iterable.js';
import { GroupElementModel } from '../../index.js';
import type { SurfaceBlockModel } from '../../models.js';
import type { LayerManager } from '../../surface-block/managers/layer-manager.js';
import { Bound } from '../../surface-block/utils/bound.js';
import { PageService } from '../page-service.js';
import type { EdgelessSelectionManager } from './services/selection-manager.js';
import type { EdgelessBlock, EdgelessElement, HitTestOptions } from './type.js';

export class EdgelessPageService extends PageService {
  private _layer!: LayerManager;
  private _surfaceModel!: SurfaceBlockModel;
  private _viewport!: {
    viewportX: number;
    viewportY: number;
    translateX: number;
    translateY: number;
    zoom: number;
  };
  private _selection!: EdgelessSelectionManager;

  override unmounted() {
    super.unmounted();
    this.selectionManager.set([]);
  }

  get selection() {
    return this._selection;
  }

  get viewport() {
    return this._viewport;
  }

  generateIndex(type: string) {
    // @ts-ignore
    return this._layer.generateIndex(type);
  }

  addElement<T = Record<string, unknown>>(props: T & { type: string }) {
    // @ts-ignore
    props['index'] = this.generateIndex(props.type);
    this._surfaceModel.addElement(props);
  }

  addBlock(
    flavour: string,
    props: Record<string, unknown>,
    parent?: string | BlockModel,
    parentIndex?: number
  ) {
    props['index'] = this.generateIndex(flavour);
    this.page.addBlock(flavour, props, parent, parentIndex);
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

  pickElementsByBound(bound: Bound): EdgelessElement[] {
    const candidates: EdgelessElement[] = (
      this._layer.canvasGrid.search(bound) as EdgelessElement[]
    ).concat(this._layer.blocksGrid.search(bound));
    const picked = candidates.filter(
      element => element.boxSelect(bound) && element.group === null
    );

    return picked;
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
}
