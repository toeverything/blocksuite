import { BlockElement } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { query } from 'lit/decorators.js';

import { ThemeObserver } from '../../_common/theme/theme-observer.js';
import { Renderer } from '../canvas-renderer/renderer.js';
import { LayerManager } from '../managers/layer-manager.js';
import type { SurfaceBlockModel } from '../surface-model.js';
import type { Bound } from '../utils/bound.js';
import type { MindmapService } from './service.js';

export class MinimapBlockComponent extends BlockElement<SurfaceBlockModel> {
  static override styles = css`
    .affine-mini-mindmap-surface {
      position: absolute;
      width: 100%;
      height: 100%;
    }
  `;

  private _layer = LayerManager.create(this.model.doc, this.model);
  private _theme = new ThemeObserver();
  private _renderer = new Renderer({
    layerManager: this._layer,
    enableStackingCanvas: true,
    provider: {
      selectedElements: () => [],
      getVariableColor: (val: string) => this._theme.getVariableValue(val),
    },
  });

  @query('.affine-mini-mindmap-surface')
  editorContainer!: HTMLDivElement;

  get mindmapService() {
    return this.host.spec.getService(
      'affine:page'
    ) as unknown as MindmapService;
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
            bound.unite(el.elementBound);
          }
        });

        if (bound!) {
          this._renderer.setViewportByBound(bound);
        }
      })
    );
  }

  override firstUpdated(_changedProperties: Map<PropertyKey, unknown>): void {
    this._renderer.attach(this.editorContainer);
    this._resizeEffect();
    this._setupCenterEffect();
  }

  override render() {
    return html`
      <div class="affine-mini-mindmap-surface">
        <!-- attach cavnas later in renderer -->
      </div>
    `;
  }
}
