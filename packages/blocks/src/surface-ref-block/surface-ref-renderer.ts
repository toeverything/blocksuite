import type {
  SurfaceBlockModel,
  SurfaceBlockService,
} from '@blocksuite/affine-block-surface';
import type { Color, NoteBlockModel } from '@blocksuite/affine-model';
import type { BlockStdScope } from '@blocksuite/block-std';
import type { Doc } from '@blocksuite/store';

import {
  CanvasRenderer,
  elementRenderers,
} from '@blocksuite/affine-block-surface';
import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import { GfxControllerIdentifier, Viewport } from '@blocksuite/block-std/gfx';
import { DisposableGroup, Slot } from '@blocksuite/global/utils';

import { getSurfaceBlock } from './utils.js';

export class SurfaceRefRenderer {
  private _surfaceModel: SurfaceBlockModel | null = null;

  private readonly _surfaceRenderer: CanvasRenderer;

  private readonly _viewport: Viewport;

  protected _disposables = new DisposableGroup();

  slots = {
    surfaceRendererInit: new Slot(),
    surfaceRendererRefresh: new Slot(),
    surfaceModelChanged: new Slot<SurfaceBlockModel>(),
    mounted: new Slot(),
    unmounted: new Slot(),
  };

  get surfaceModel() {
    return this._surfaceModel;
  }

  get surfaceRenderer() {
    return this._surfaceRenderer;
  }

  get surfaceService() {
    return this.std.getService('affine:surface') as SurfaceBlockService;
  }

  get viewport() {
    return this._viewport;
  }

  constructor(
    readonly id: string,
    readonly doc: Doc,
    readonly std: BlockStdScope,
    options: {
      enableStackingCanvas?: boolean;
    } = {
      enableStackingCanvas: false,
    }
  ) {
    const viewport = new Viewport();
    const renderer = new CanvasRenderer({
      viewport,
      layerManager: std.get(GfxControllerIdentifier).layer,
      gridManager: std.get(GfxControllerIdentifier).grid,
      enableStackingCanvas: options.enableStackingCanvas,
      provider: {
        generateColorProperty: (color: Color, fallback: string) =>
          ThemeObserver.generateColorProperty(color, fallback),
        getColorScheme: () => ThemeObserver.mode,
        getColorValue: (color: Color, fallback?: string, real?: boolean) =>
          ThemeObserver.getColorValue(color, fallback, real),
        getPropertyValue: (property: string) =>
          ThemeObserver.getPropertyValue(property),
      },
      elementRenderers,
    });

    this._surfaceRenderer = renderer;
    this._viewport = viewport;
  }

  private _initSurfaceModel() {
    const init = () => {
      const model = getSurfaceBlock(this.doc);
      this._surfaceModel = model;

      if (!model) return;
      this.slots.surfaceModelChanged.emit(model);
    };

    init();

    if (!this._surfaceModel) {
      this._disposables.add(
        this.doc.slots.blockUpdated.on(({ type }) => {
          if (
            type === 'add' &&
            !this._surfaceModel &&
            getSurfaceBlock(this.doc)
          ) {
            init();
          }
        })
      );
    }
  }

  private _initSurfaceRenderer() {
    this.slots.surfaceRendererInit.emit();
  }

  getModel(id: string): BlockSuite.EdgelessModel | null {
    return (
      (this.doc.getBlockById(id) as Exclude<
        BlockSuite.EdgelessBlockModelType,
        NoteBlockModel
      >) ??
      this._surfaceModel?.getElementById(id) ??
      null
    );
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
}
