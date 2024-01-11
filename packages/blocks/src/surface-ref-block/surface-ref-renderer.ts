import type { BlockStdScope } from '@blocksuite/block-std';
import { DisposableGroup, Slot } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';

import { ThemeObserver } from '../_common/theme/theme-observer.js';
import type { EdgelessElement, TopLevelBlockModel } from '../_common/types.js';
import type { NoteBlockModel } from '../note-block/index.js';
import { ConnectorPathGenerator } from '../page-block/edgeless/managers/connector-manager.js';
import type { SurfaceElement } from '../surface-block/elements/surface-element.js';
import { Renderer } from '../surface-block/index.js';
import type { SurfaceBlockModel } from '../surface-block/surface-model.js';
import type { SurfacePageService } from '../surface-block/surface-page-service.js';
import { getSurfaceBlock } from './utils.js';

type RefElement = Exclude<EdgelessElement, NoteBlockModel>;

export class SurfaceRefRenderer {
  private readonly _surfaceRenderer: Renderer;
  private readonly _connectorManager: ConnectorPathGenerator;
  private readonly _elements: Map<string, SurfaceElement>;

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

  get elements() {
    return this._elements;
  }

  get connectorManager() {
    return this._connectorManager;
  }

  constructor(
    public readonly id: string,
    public readonly page: Page,
    public readonly std: BlockStdScope
  ) {
    const themeObserver = new ThemeObserver();
    const renderer = new Renderer({
      layerManager: this.surfaceService.layer,
      provider: {
        getVariableColor: (variable: string) =>
          themeObserver.getVariableValue(variable),
      },
    });

    themeObserver.observe(document.documentElement);
    this._surfaceRenderer = renderer;
    this._connectorManager = new ConnectorPathGenerator({
      getElementById: id => this.getModel(id),
      refresh: () => renderer.refresh(),
    });

    this._elements = new Map<string, SurfaceElement>();
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

  getModel(id: string): RefElement | null {
    return (
      (this.page.getBlockById(id) as Exclude<
        TopLevelBlockModel,
        NoteBlockModel
      >) ??
      this._elements.get(id) ??
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
