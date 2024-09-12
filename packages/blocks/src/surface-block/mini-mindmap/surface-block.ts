import type { SurfaceBlockModel } from '@blocksuite/affine-block-surface';
import type { Color, ShapeElementModel } from '@blocksuite/affine-model';
import type { Bound } from '@blocksuite/global/utils';

import {
  CanvasRenderer,
  elementRenderers,
  fitContent,
} from '@blocksuite/affine-block-surface';
import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import { BlockComponent } from '@blocksuite/block-std';
import { GfxControllerIdentifier } from '@blocksuite/block-std/gfx';
import { html } from 'lit';
import { query } from 'lit/decorators.js';

import type { MindmapService } from './minmap-service.js';

export class MindmapSurfaceBlock extends BlockComponent<SurfaceBlockModel> {
  renderer?: CanvasRenderer;

  private get _grid() {
    return this.std.get(GfxControllerIdentifier).grid;
  }

  private get _layer() {
    return this.std.get(GfxControllerIdentifier).layer;
  }

  get mindmapService() {
    return this.std.getService('affine:page') as unknown as MindmapService;
  }

  get viewport() {
    return this.std.get(GfxControllerIdentifier).viewport;
  }

  constructor() {
    super();
  }

  private _adjustNodeWidth() {
    this.model.doc.transact(() => {
      this.model.elementModels.forEach(element => {
        if (element.type === 'shape') {
          fitContent(element as ShapeElementModel);
        }
      });
    });
  }

  private _resizeEffect() {
    const observer = new ResizeObserver(() => {
      this.viewport.onResize();
    });

    observer.observe(this.editorContainer);
    this._disposables.add(() => {
      observer.disconnect();
    });
  }

  private _setupCenterEffect() {
    this._disposables.add(
      this.mindmapService.requestCenter.on(() => {
        let bound: Bound;

        this.model.elementModels.forEach(el => {
          if (!bound) {
            bound = el.elementBound;
          } else {
            bound = bound.unite(el.elementBound);
          }
        });

        if (bound!) {
          this.viewport.setViewportByBound(bound, [10, 10, 10, 10]);
        }
      })
    );
  }

  private _setupRenderer() {
    this._disposables.add(
      this.model.elementUpdated.on(() => {
        this.renderer?.refresh();
        this.mindmapService.center();
      })
    );

    this.viewport.ZOOM_MIN = 0.01;
  }

  override connectedCallback(): void {
    super.connectedCallback();

    this.renderer = new CanvasRenderer({
      viewport: this.viewport,
      layerManager: this._layer,
      gridManager: this._grid,
      enableStackingCanvas: true,
      provider: {
        selectedElements: () => [],
        getColorScheme: () => ThemeObserver.mode,
        getColorValue: (color: Color, fallback?: string, real?: boolean) =>
          ThemeObserver.getColorValue(color, fallback, real),
        generateColorProperty: (color: Color, fallback: string) =>
          ThemeObserver.generateColorProperty(color, fallback),
        getPropertyValue: (property: string) =>
          ThemeObserver.getPropertyValue(property),
      },
      elementRenderers,
    });
  }

  override firstUpdated(_changedProperties: Map<PropertyKey, unknown>): void {
    this.renderer?.attach(this.editorContainer);

    this._resizeEffect();
    this._setupCenterEffect();
    this._setupRenderer();
    this._adjustNodeWidth();
    this.mindmapService.center();
  }

  override render() {
    return html`
      <style>
        .affine-mini-mindmap-surface {
          width: 100%;
          height: 100%;
        }
      </style>
      <div class="affine-mini-mindmap-surface">
        <!-- attach cavnas later in renderer -->
      </div>
    `;
  }

  @query('.affine-mini-mindmap-surface')
  accessor editorContainer!: HTMLDivElement;
}
