import type { BlockStdScope } from '@blocksuite/block-std';
import { DisposableGroup, Slot } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';

import { ThemeObserver } from '../_common/theme/theme-observer.js';
import type { EdgelessModel, TopLevelBlockModel } from '../_common/types.js';
import type { NoteBlockModel } from '../note-block/index.js';
import { Renderer } from '../surface-block/index.js';
import type { SurfaceBlockModel } from '../surface-block/surface-model.js';
import type { SurfacePageService } from '../surface-block/surface-page-service.js';
import { getSurfaceBlock } from './utils.js';

export class SurfaceRefRenderer {
  private readonly _surfaceRenderer: Renderer;

  private _surfaceModel: SurfaceBlockModel | null = null;
  protected _disposables = new DisposableGroup();

  slots = {
    surfaceRendererInit: new Slot(),
    surfaceRendererRefresh: new Slot(),
    surfaceModelChanged: new Slot<SurfaceBlockModel>(),
    mounted: new Slot(),
    unmounted: new Slot(),
  };

  get surfaceService() {
    return this.std.spec.getService('affine:surface') as SurfacePageService;
  }

  get surfaceRenderer() {
    return this._surfaceRenderer;
  }

  get surfaceModel() {
    return this._surfaceModel;
  }

  constructor(
    public readonly id: string,
    public readonly page: Page,
    public readonly std: BlockStdScope,
    options: {
      enableStackingCanvas?: boolean;
    } = {
      enableStackingCanvas: false,
    }
  ) {
    const themeObserver = new ThemeObserver();
    const renderer = new Renderer({
      layerManager: this.surfaceService.layer,
      enableStackingCanvas: options.enableStackingCanvas,
      provider: {
        getVariableColor: (variable: string) =>
          themeObserver.getVariableValue(variable),
      },
    });

    themeObserver.observe(document.documentElement);
    this._surfaceRenderer = renderer;
    this.slots.unmounted.once(() => {
      themeObserver.dispose();
    });
  }

  mount() {
    if (this._disposables.disposed) {
      this._disposables = new DisposableGroup();
    }

    this._initSurfaceModel();
    this._initSurfaceRenderer();
    this.slots.mounted.emit();
  }

  unmount() {
    this._disposables.dispose();
    this.slots.unmounted.emit();
  }

  getModel(id: string): EdgelessModel | null {
    return (
      (this.page.getBlockById(id) as Exclude<
        TopLevelBlockModel,
        NoteBlockModel
      >) ??
      this._surfaceModel?.getElementById(id) ??
      null
    );
  }

  private _initSurfaceRenderer() {
    this.slots.surfaceRendererInit.emit();
  }

  private _initSurfaceModel() {
    const init = () => {
      const model = getSurfaceBlock(this.page);
      this._surfaceModel = model;
      this.slots.surfaceModelChanged.emit(model);

      if (!this._surfaceModel) return;
    };

    init();

    if (!this._surfaceModel) {
      this._disposables.add(
        this.page.slots.blockUpdated.on(({ type }) => {
          if (
            type === 'add' &&
            !this._surfaceModel &&
            getSurfaceBlock(this.page)
          ) {
            init();
          }
        })
      );
    }
  }
}
