import type { Color, ShapeElementModel } from '@blocksuite/affine-model';
import type { Bound } from '@blocksuite/global/utils';

import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import { BlockComponent } from '@blocksuite/block-std';
import { html } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import type { SurfaceBlockModel } from '../surface-model.js';
import type { MindmapService } from './service.js';

import { Viewport } from '../../root-block/edgeless/utils/viewport.js';
import { fitContent } from '../canvas-renderer/element-renderer/shape/utils.js';
import { Renderer } from '../canvas-renderer/renderer.js';
import { LayerManager } from '../managers/layer-manager.js';

@customElement('mini-mindmap-surface-block')
export class MindmapSurfaceBlock extends BlockComponent<SurfaceBlockModel> {
  private _layer?: LayerManager;

  private _renderer?: Renderer;

  private _viewport: Viewport;

  constructor() {
    super();
    this._viewport = new Viewport();
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
      this._viewport.onResize();
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
          this._viewport.setViewportByBound(bound, [10, 10, 10, 10]);
        }
      })
    );
  }

  private _setupRenderer() {
    this._disposables.add(
      this.model.elementUpdated.on(() => {
        this._renderer?.refresh();
        this.mindmapService.center();
      })
    );

    this._viewport.ZOOM_MIN = 0.01;
  }

  override connectedCallback(): void {
    super.connectedCallback();

    this._layer = LayerManager.create(this.doc, this.model);
    this._viewport = new Viewport();
    this._renderer = new Renderer({
      viewport: this._viewport,
      layerManager: this._layer,
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
    });
  }

  override firstUpdated(_changedProperties: Map<PropertyKey, unknown>): void {
    this._renderer?.attach(this.editorContainer);
    this._viewport.setContainer(this.editorContainer);

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

  get mindmapService() {
    return this.host.spec.getService(
      'affine:page'
    ) as unknown as MindmapService;
  }

  @query('.affine-mini-mindmap-surface')
  accessor editorContainer!: HTMLDivElement;
}
