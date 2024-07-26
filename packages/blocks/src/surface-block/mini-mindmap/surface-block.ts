import type { Bound } from '@blocksuite/global/utils';

import { BlockComponent } from '@blocksuite/block-std';
import { html } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import type { Viewport } from '../../root-block/edgeless/utils/viewport.js';
import type { CustomColor } from '../consts.js';
import type { ShapeElementModel } from '../element-model/shape.js';
import type { SurfaceBlockModel } from '../surface-model.js';
import type { MindmapService } from './service.js';

import { ThemeObserver } from '../../_common/theme/theme-observer.js';
import { fitContent } from '../canvas-renderer/element-renderer/shape/utils.js';
import { Renderer } from '../canvas-renderer/renderer.js';
import { LayerManager } from '../managers/layer-manager.js';

@customElement('mini-mindmap-surface-block')
export class MindmapSurfaceBlock extends BlockComponent<SurfaceBlockModel> {
  private _layer!: LayerManager;

  private _renderer!: Renderer;

  private _theme = new ThemeObserver();

  private _viewport!: Viewport;

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
        this._renderer.refresh();
        this.mindmapService.center();
      })
    );

    this._viewport.ZOOM_MIN = 0.01;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._layer = LayerManager.create(this.doc, this.model);
    this._renderer = new Renderer({
      viewport: this._viewport,
      layerManager: this._layer,
      enableStackingCanvas: true,
      provider: {
        selectedElements: () => [],
        getColorScheme: () => this._theme.mode,
        getVariableColor: (val: string) => this._theme.getVariableValue(val),
        getColor: (
          color: string | CustomColor,
          fallback?: string,
          real?: boolean
        ) => this._theme.getColor(color, fallback, real),
        generateColorProperty: (
          color: string | CustomColor,
          fallback: string
        ) => this._theme.generateColorProperty(color, fallback),
      },
    });
    this._theme.observe(this.ownerDocument.documentElement);
    this.disposables.add(() => this._theme.dispose());
  }

  override firstUpdated(_changedProperties: Map<PropertyKey, unknown>): void {
    this._renderer.attach(this.editorContainer);
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
