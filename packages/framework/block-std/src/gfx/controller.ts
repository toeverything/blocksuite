import type { BlockModel } from '@blocksuite/store';

import {
  assertType,
  Bound,
  DisposableGroup,
  getCommonBoundWithRotation,
  type IBound,
  last,
} from '@blocksuite/global/utils';
import { Signal } from '@preact/signals-core';

import type { BlockStdScope } from '../scope/block-std-scope.js';
import type { BlockComponent } from '../view/index.js';
import type { CursorType } from './cursor.js';
import type { PointTestOptions } from './model/base.js';
import type { GfxModel } from './model/model.js';
import type { SurfaceBlockModel } from './model/surface/surface-model.js';

import { LifeCycleWatcher } from '../extension/lifecycle-watcher.js';
import { onSurfaceAdded } from '../utils/gfx.js';
import {
  GfxClassExtenderIdentifier,
  GfxExtensionIdentifier,
} from './extension.js';
import { GridManager } from './grid.js';
import { gfxControllerKey } from './identifiers.js';
import { KeyboardController } from './keyboard.js';
import { LayerManager } from './layer.js';
import { GfxBlockElementModel } from './model/gfx-block-model.js';
import {
  GfxGroupLikeElementModel,
  GfxPrimitiveElementModel,
} from './model/surface/element-model.js';
import { Viewport } from './viewport.js';

export class GfxController extends LifeCycleWatcher {
  static override key = gfxControllerKey;

  private _disposables: DisposableGroup = new DisposableGroup();

  private _surface: SurfaceBlockModel | null = null;

  readonly cursor$ = new Signal<CursorType>();

  readonly grid: GridManager;

  readonly keyboard: KeyboardController;

  readonly layer: LayerManager;

  readonly viewport: Viewport = new Viewport();

  get doc() {
    return this.std.doc;
  }

  get elementsBound() {
    return getCommonBoundWithRotation(this.gfxElements);
  }

  get gfxElements(): GfxModel[] {
    return [...this.layer.blocks, ...this.layer.canvasElements];
  }

  get surface() {
    return this._surface;
  }

  get surfaceComponent(): BlockComponent | null {
    return this.surface
      ? (this.std.view.getBlock(this.surface.id) ?? null)
      : null;
  }

  constructor(std: BlockStdScope) {
    super(std);

    this.grid = new GridManager();
    this.layer = new LayerManager(this.doc, null);
    this.keyboard = new KeyboardController(std);

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
    this._disposables.add(this.keyboard);

    this.std.provider.getAll(GfxClassExtenderIdentifier).forEach(ext => {
      ext.extendFn(this);
    });
  }

  deleteElement(element: GfxModel | BlockModel<object> | string): void {
    element = typeof element === 'string' ? element : element.id;

    assertType<string>(element);

    if (this.surface?.hasElementById(element)) {
      this.surface.deleteElement(element);
    } else {
      const block = this.doc.getBlock(element)?.model;
      block && this.doc.deleteBlock(block);
    }
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
      x: x - responsePadding[0],
      y: y - responsePadding[1],
      w: responsePadding[0] * 2,
      h: responsePadding[1] * 2,
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

  getElementInGroup(
    x: number,
    y: number,
    options?: PointTestOptions
  ): GfxModel | null {
    const selectionManager = this.selection;
    const results = this.getElementByPoint(x, y, {
      ...options,
      all: true,
    });

    let picked = last(results) ?? null;
    const { activeGroup } = selectionManager;
    const first = picked;

    if (activeGroup && picked && activeGroup.hasDescendant(picked)) {
      let index = results.length - 1;

      while (
        picked === activeGroup ||
        (picked instanceof GfxGroupLikeElementModel &&
          picked.hasDescendant(activeGroup))
      ) {
        picked = results[--index];
      }
    } else if (picked) {
      let index = results.length - 1;

      while (picked.group instanceof GfxGroupLikeElementModel) {
        if (--index < 0) {
          picked = null;
          break;
        }
        picked = results[index];
      }
    }

    return (picked ?? first) as GfxModel | null;
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
    this.viewport.setViewportElement(this.std.host);
    this.std.provider.getAll(GfxExtensionIdentifier).forEach(ext => {
      ext.mounted();
    });
  }

  override unmounted() {
    this.std.provider.getAll(GfxExtensionIdentifier).forEach(ext => {
      ext.unmounted();
    });
    this.viewport.clearViewportElement();
    this._disposables.dispose();
  }

  updateElement(
    element: GfxModel | string,
    props: Record<string, unknown>
  ): void {
    const elemId = typeof element === 'string' ? element : element.id;

    if (this.surface?.hasElementById(elemId)) {
      this.surface.updateElement(elemId, props);
    } else {
      const block = this.doc.getBlock(elemId);
      block && this.doc.updateBlock(block.model, props);
    }
  }
}
