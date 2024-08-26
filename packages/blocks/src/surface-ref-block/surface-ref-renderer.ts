import type { Color } from '@blocksuite/affine-model';
import type { NoteBlockModel } from '@blocksuite/affine-model';
import type { BlockStdScope } from '@blocksuite/block-std';
import type { Doc } from '@blocksuite/store';

import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import { DisposableGroup, Slot } from '@blocksuite/global/utils';

import type { SurfaceBlockModel } from '../surface-block/surface-model.js';

import { Viewport } from '../root-block/edgeless/utils/viewport.js';
import { Renderer } from '../surface-block/index.js';
import { getSurfaceBlock } from './utils.js';

export class SurfaceRefRenderer {
  protected _disposables = new DisposableGroup();

  private _surfaceModel: SurfaceBlockModel | null = null;

  private readonly _surfaceRenderer: Renderer;

  private readonly _viewport: Viewport;

  slots = {
    surfaceRendererInit: new Slot(),
    surfaceRendererRefresh: new Slot(),
    surfaceModelChanged: new Slot<SurfaceBlockModel>(),
    mounted: new Slot(),
    unmounted: new Slot(),
  };

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
    const renderer = new Renderer({
      viewport,
      layerManager: this.surfaceService.layer,
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

  get surfaceModel() {
    return this._surfaceModel;
  }

  get surfaceRenderer() {
    return this._surfaceRenderer;
  }

  get surfaceService() {
    return this.std.spec.getService('affine:surface');
  }

  get viewport() {
    return this._viewport;
  }
}
