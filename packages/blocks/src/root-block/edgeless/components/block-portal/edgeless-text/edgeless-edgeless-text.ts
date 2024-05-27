import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { EDGELESS_BLOCK_CHILD_PADDING } from '../../../../../_common/consts.js';
import type { EdgelessTextBlockModel } from '../../../../../edgeless-text/edgeless-text-model.js';
import { Bound } from '../../../../../surface-block/utils/bound.js';
import type { EdgelessBlockModel } from '../../../type.js';
import { EdgelessPortalBase } from '../edgeless-portal-base.js';

@customElement('edgeless-block-portal-edgeless-text')
export class EdgelessBlockPortalEdgelessText extends EdgelessPortalBase<EdgelessTextBlockModel> {
  static override styles = css`
    .edgeless-block-portal-note:has(.affine-embed-synced-doc-container.editing)
      > edgeless-note-mask {
      display: none;
    }
  `;

  @state()
  private accessor _editing = false;

  @state()
  private accessor _isResizing = false;

  @state()
  private accessor _isHover = false;

  get _zoom() {
    return this.edgeless.service.viewport.zoom;
  }

  private _hovered() {
    if (!this._isHover && this.edgeless.service.selection.has(this.model.id)) {
      this._isHover = true;
    }
  }

  private _leaved() {
    if (this._isHover) {
      this._isHover = false;
    }
  }

  override firstUpdated() {
    const { disposables, edgeless } = this;
    const selection = this.edgeless.service.selection;

    disposables.add(
      edgeless.slots.elementResizeStart.on(() => {
        if (selection.elements.includes(this.model as EdgelessBlockModel)) {
          this._isResizing = true;
        }
      })
    );
    disposables.add(
      edgeless.slots.elementResizeEnd.on(() => {
        this._isResizing = false;
      })
    );
  }

  override connectedCallback(): void {
    super.connectedCallback();

    const selection = this.edgeless.service.selection;

    this._editing = selection.has(this.model.id) && selection.editing;
    this._disposables.add(
      selection.slots.updated.on(() => {
        if (selection.has(this.model.id) && selection.editing) {
          this._editing = true;
        } else {
          this._editing = false;
        }
      })
    );
  }

  override render() {
    const { model, index } = this;

    const { xywh, scale = 1 } = model;

    const bound = Bound.deserialize(xywh);
    const width = bound.w / scale;

    const style = {
      position: 'absolute',
      zIndex: `${index}`,
      width: `${width}px`,
      left: `${bound.x}px`,
      top: `${bound.y}px`,
      padding: `${EDGELESS_BLOCK_CHILD_PADDING}px`,
      boxSizing: 'border-box',
      pointerEvents: this._editing ? 'none' : 'all',
      transformOrigin: '0 0',
      transform: `scale(${scale})`,
    };

    return html`
      <div
        class="edgeless-block-portal-note blocksuite-overlay"
        style=${styleMap(style)}
        data-model-height="${bound.h}"
        @mouseleave=${this._leaved}
        @mousemove=${this._hovered}
        data-scale="${scale}"
      >
        <div
          style=${styleMap({
            width: '100%',
            height: '100%',
          })}
        >
          ${this.renderModel(model)}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-block-portal-edgeless-text': EdgelessBlockPortalEdgelessText;
  }
}
