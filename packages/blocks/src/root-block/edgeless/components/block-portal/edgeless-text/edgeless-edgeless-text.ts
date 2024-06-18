import '../../../../../edgeless-text/edgeless-text-block.js';

import { css, html, type PropertyValueMap } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';

import type { EdgelessTextBlockComponent } from '../../../../../edgeless-text/edgeless-text-block.js';
import {
  EDGELESS_TEXT_BLOCK_MIN_HEIGHT,
  EDGELESS_TEXT_BLOCK_MIN_WIDTH,
} from '../../../../../edgeless-text/edgeless-text-block.js';
import type { EdgelessTextBlockModel } from '../../../../../edgeless-text/edgeless-text-model.js';
import { Bound } from '../../../../../surface-block/utils/bound.js';
import { HandleDirection } from '../../resize/resize-handles.js';
import { EdgelessPortalBase } from '../edgeless-portal-base.js';

@customElement('edgeless-block-portal-edgeless-text')
export class EdgelessBlockPortalEdgelessText extends EdgelessPortalBase<EdgelessTextBlockModel> {
  static override styles = css`
    .edgeless-text-block-container[data-max-width='false'] .inline-editor span {
      word-break: normal !important;
      overflow-wrap: normal !important;
    }
  `;

  @query('.edgeless-text-block-container')
  private accessor _textContainer!: HTMLDivElement;

  @query('affine-edgeless-text')
  private accessor _edgelessText!: EdgelessTextBlockComponent;

  @state()
  private accessor _editing = false;

  private _horizontalResizing = false;

  private _resizeObserver = new ResizeObserver(() => {
    const rect = this._textContainer.getBoundingClientRect();
    const bound = Bound.deserialize(this.model.xywh);
    if (
      (this._editing && !this.model.hasMaxWidth) ||
      rect.width > bound.w * this.edgeless.service.zoom
    ) {
      this._updateW();
    }

    this._updateH();
  });

  private _updateH() {
    const bound = Bound.deserialize(this.model.xywh);
    const rect = this._textContainer.getBoundingClientRect();
    bound.h = Math.max(
      rect.height / this.edgeless.service.zoom,
      EDGELESS_TEXT_BLOCK_MIN_HEIGHT * this.edgeless.service.zoom
    );

    this.edgeless.doc.updateBlock(this.model, {
      xywh: bound.serialize(),
    });
  }

  private _updateW() {
    const bound = Bound.deserialize(this.model.xywh);
    const rect = this._textContainer.getBoundingClientRect();
    bound.w = Math.max(
      rect.width / this.edgeless.service.zoom,
      EDGELESS_TEXT_BLOCK_MIN_WIDTH * this.edgeless.service.zoom
    );

    this.edgeless.doc.updateBlock(this.model, {
      xywh: bound.serialize(),
    });
  }

  checkWidthOverflow(width: number) {
    let wValid = true;

    const oldWidthStr = this._textContainer.style.width;
    this._textContainer.style.width = `${width}px`;
    if (
      this._edgelessText.childrenContainer.scrollWidth >
      this._edgelessText.childrenContainer.offsetWidth
    ) {
      wValid = false;
    }
    this._textContainer.style.width = oldWidthStr;

    return wValid;
  }

  override firstUpdated(props: PropertyValueMap<unknown>) {
    super.firstUpdated(props);

    const { disposables, edgeless } = this;
    const edgelessSelection = edgeless.service.selection;
    const selectedRect = this.portalContainer.selectedRect;

    disposables.add(
      selectedRect.slots.dragStart
        .filter(() => edgelessSelection.selectedElements.includes(this.model))
        .on(() => {
          if (
            selectedRect.dragDirection === HandleDirection.Left ||
            selectedRect.dragDirection === HandleDirection.Right
          ) {
            this._horizontalResizing = true;
          }
        })
    );
    disposables.add(
      selectedRect.slots.dragEnd
        .filter(() => edgelessSelection.selectedElements.includes(this.model))
        .on(() => {
          if (
            selectedRect.dragDirection === HandleDirection.Left ||
            selectedRect.dragDirection === HandleDirection.Right
          ) {
            this._horizontalResizing = false;
          }
        })
    );

    disposables.add(
      edgelessSelection.slots.updated.on(() => {
        if (edgelessSelection.has(this.model.id) && edgelessSelection.editing) {
          this._editing = true;
        } else {
          this._editing = false;
        }
      })
    );

    this._resizeObserver.observe(this._textContainer);
    this.model.deleted.on(() => {
      this._resizeObserver.disconnect();
    });
  }

  override render() {
    const { model, index } = this;
    const { xywh, scale, rotate, hasMaxWidth } = model;
    const bound = Bound.deserialize(xywh);

    const containerStyle: StyleInfo = {
      transform: `rotate(${rotate}deg)`,
      transformOrigin: 'center',
      padding: '10px',
      border: `1px solid ${this._editing ? 'var(--affine—primary—color, #1e96eb)' : 'transparent'}`,
      borderRadius: '4px',
      boxSizing: 'border-box',
      boxShadow: this._editing
        ? '0px 0px 0px 2px rgba(30, 150, 235, 0.3)'
        : 'none',
    };

    if (hasMaxWidth || this._horizontalResizing) {
      containerStyle.width = `${bound.w / scale}px`;
    }

    return html`
      <div
        style=${styleMap({
          position: 'absolute',
          zIndex: `${index}`,
          left: `${bound.x}px`,
          top: `${bound.y}px`,
          transform: `scale(${scale})`,
          transformOrigin: '0 0',
        })}
        data-scale="${scale}"
      >
        <div
          class="edgeless-text-block-container"
          data-max-width="${hasMaxWidth}"
          style=${styleMap(containerStyle)}
        >
          <div
            style=${styleMap({
              position: 'absolute',
              top: '0',
              left: '0',
              bottom: '0',
              right: '0',
              display: this._editing ? 'none' : 'block',
            })}
          ></div>
          <div
            style=${styleMap({
              pointerEvents: this._editing ? 'auto' : 'none',
            })}
          >
            ${this.renderModel(model)}
          </div>
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
