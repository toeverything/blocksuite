import { WidgetElement } from '@blocksuite/block-std';
import { css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { AIToolController } from '../../edgeless/controllers/tools/ai-tool.js';
import type { EdgelessRootBlockComponent } from '../../index.js';

export const AFFINE_EDGELESS_AI_WIDGET = 'affine-edgeless-ai-widget';

@customElement('affine-edgeless-ai-widget')
export class EdgeelssAIWidget extends WidgetElement<EdgelessRootBlockComponent> {
  static override styles = css`
    .affine-edgeless-ai {
    }

    .ai-selection-rect {
      position: absolute;
      border-radius: 4px;
      border: 2px dashed var(--affine-brand-color, #1e96eb);
    }
  `;

  @state()
  private _selectionRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;

  get edgeless() {
    return this.blockElement;
  }

  private _updateSelection(rect: DOMRect) {
    const zoom = this.edgeless.service.viewport.zoom;
    const [x, y] = this.edgeless.service.viewport.toViewCoord(
      rect.left,
      rect.top
    );
    const [width, height] = [rect.width * zoom, rect.height * zoom];

    this._selectionRect = { x, y, width, height };
  }

  override connectedCallback(): void {
    super.connectedCallback();

    const AITool = this.edgeless.tools.controllers['ai'] as AIToolController;

    this._disposables.add(
      AITool.draggingAreaUpdated.on(() => {
        this._updateSelection(AITool.area);
      })
    );

    this._disposables.add(
      this.edgeless.service.viewport.viewportUpdated.on(() => {
        this._updateSelection(AITool.area);
      })
    );
  }

  override render() {
    const rect = this._selectionRect;

    return html`<div class="affine-edgeless-ai">
      ${rect?.width && rect?.height
        ? html`<div
            class="ai-selection-rect"
            style=${styleMap({
              left: `${rect.x}px`,
              top: `${rect.y}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
            })}
          ></div>`
        : nothing}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_EDGELESS_AI_WIDGET]: EdgeelssAIWidget;
  }
}
