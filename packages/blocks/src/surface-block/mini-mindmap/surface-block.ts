import { BlockElement } from '@blocksuite/block-std';
import { html } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import { ThemeObserver } from '../../_common/theme/theme-observer.js';
import { fitContent } from '../canvas-renderer/element-renderer/shape/utils.js';
import { Renderer } from '../canvas-renderer/renderer.js';
import type { ShapeElementModel } from '../element-model/shape.js';
import { LayerManager } from '../managers/layer-manager.js';
import type { SurfaceBlockModel } from '../surface-model.js';
import type { Bound } from '../utils/bound.js';
import type { MindmapService } from './service.js';

@customElement('mini-mindmap-surface-block')
export class MindmapSurfaceBlock extends BlockElement<SurfaceBlockModel> {
  private _theme = new ThemeObserver();

  private _layer!: LayerManager;

  private _renderer!: Renderer;

  @query('.affine-mini-mindmap-surface')
  accessor editorContainer!: HTMLDivElement;

  get mindmapService() {
    return this.host.spec.getService(
      'affine:page'
    ) as unknown as MindmapService;
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
      this._renderer.onResize();
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
          this._renderer.setViewportByBound(bound, [10, 10, 10, 10]);
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

    this._renderer.ZOOM_MIN = 0.01;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._layer = LayerManager.create(this.doc, this.model);
    this._renderer = new Renderer({
      layerManager: this._layer,
      enableStackingCanvas: true,
      provider: {
        selectedElements: () => [],
        getVariableColor: (val: string) => this._theme.getVariableValue(val),
      },
    });
    this._theme.observe(this.ownerDocument.documentElement);
    this.disposables.add(this._theme);
  }

  override firstUpdated(_changedProperties: Map<PropertyKey, unknown>): void {
    this._renderer.attach(this.editorContainer);
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
}
