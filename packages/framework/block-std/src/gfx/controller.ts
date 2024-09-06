import type { ServiceIdentifier } from '@blocksuite/global/di';
import type { BlockModel } from '@blocksuite/store';

import {
  Bound,
  DisposableGroup,
  type IBound,
  last,
} from '@blocksuite/global/utils';

import type { BlockStdScope } from '../scope/block-std-scope.js';
import type { SurfaceBlockModel } from './surface/surface-model.js';

import { LifeCycleWatcher } from '../extension/lifecycle-watcher.js';
import { LifeCycleWatcherIdentifier } from '../identifier.js';
import { onSurfaceAdded } from '../utils/gfx.js';
import { GfxBlockElementModel, type GfxModel } from './gfx-block-model.js';
import { GridManager } from './grid.js';
import { LayerManager } from './layer.js';
import {
  GfxPrimitiveElementModel,
  type PointTestOptions,
} from './surface/element-model.js';
import { Viewport } from './viewport.js';

export class GfxController extends LifeCycleWatcher {
  static override key = 'gfxController';

  private _disposables: DisposableGroup = new DisposableGroup();

  private _surface: SurfaceBlockModel | null = null;

  readonly grid: GridManager;

  readonly layer: LayerManager;

  readonly viewport: Viewport = new Viewport();

  get doc() {
    return this.std.doc;
  }

  get surface() {
    return this._surface;
  }

  constructor(std: BlockStdScope) {
    super(std);

    this.grid = new GridManager();
    this.layer = new LayerManager(this.doc, null);

    this._disposables.add(
      onSurfaceAdded(this.doc, surface => {
        this._surface = surface;

        if (surface) {
          this._disposables.add(this.grid.watch({ surface }));
          this.layer.watch({ surface });
        }
      })
    );
    this._disposables.add(this.grid.watch({ doc: this.doc }));
    this._disposables.add(this.layer);
    this._disposables.add(this.viewport);
  }

  /**
   * Get a block or element by its id.
   * Note that non-gfx block can also be queried in this method.
   * @param id
   * @returns
   */
  getElementById<
    T extends GfxModel | BlockModel<object> = GfxModel | BlockModel<object>,
  >(id: string): T | null {
    // @ts-ignore
    return (
      this.surface?.getElementById(id) ?? this.doc.getBlock(id)?.model ?? null
    );
  }
  /**
   * Get elements on a specific point.
   * @param x
   * @param y
   * @param options
   */
  getElementByPoint(
    x: number,
    y: number,
    options: { all: true } & PointTestOptions
  ): GfxModel[];

  getElementByPoint(
    x: number,
    y: number,
    options?: { all?: false } & PointTestOptions
  ): GfxModel | null;
  getElementByPoint(
    x: number,
    y: number,
    options: PointTestOptions & {
      all?: boolean;
    } = { all: false, hitThreshold: 10 }
  ): GfxModel | GfxModel[] | null {
    options.zoom = this.viewport.zoom;
    options.hitThreshold ??= 10;

    const hitThreshold = options.hitThreshold;
    const responsePadding = options.responsePadding ?? [
      hitThreshold / 2,
      hitThreshold / 2,
    ];
    const all = options.all ?? false;
    const hitTestBound = {
      x: x - responsePadding[1],
      y: y - responsePadding[0],
      w: responsePadding[1] * 2,
      h: responsePadding[0] * 2,
    };

    const candidates = this.grid.search(hitTestBound);
    const picked = candidates.filter(
      elm =>
        elm.includesPoint(x, y, options as PointTestOptions, this.std.host) ||
        elm.externalBound?.isPointInBound([x, y])
    );

    picked.sort(this.layer.compare);

    if (all) {
      return picked;
    }

    return last(picked) ?? null;
  }
  /**
   * Query all elements in an area.
   * @param bound
   * @param options
   */
  getElementsByBound(
    bound: IBound | Bound,
    options?: { type: 'all' }
  ): GfxModel[];
  getElementsByBound(
    bound: IBound | Bound,
    options: { type: 'canvas' }
  ): GfxPrimitiveElementModel[];

  getElementsByBound(
    bound: IBound | Bound,
    options: { type: 'block' }
  ): GfxBlockElementModel[];

  getElementsByBound(
    bound: IBound | Bound,
    options: { type: 'block' | 'canvas' | 'all' } = {
      type: 'all',
    }
  ): GfxModel[] {
    bound = bound instanceof Bound ? bound : Bound.from(bound);

    let candidates = this.grid.search(bound);

    if (options.type !== 'all') {
      const filter =
        options.type === 'block'
          ? (elm: GfxModel) => elm instanceof GfxBlockElementModel
          : (elm: GfxModel) => elm instanceof GfxPrimitiveElementModel;

      candidates = candidates.filter(filter);
    }

    candidates.sort(this.layer.compare);

    return candidates;
  }

  getElementsByType(type: string): (GfxModel | BlockModel<object>)[] {
    return (
      this.surface?.getElementsByType(type) ??
      this.doc.getBlocksByFlavour(type).map(b => b.model)
    );
  }

  override mounted() {
    this.viewport.setViewportElm(this.std.host);
  }

  override unmounted() {
    this._disposables.dispose();
  }
}

export const GfxControllerIdentifier = LifeCycleWatcherIdentifier(
  GfxController.key
) as ServiceIdentifier<GfxController>;
