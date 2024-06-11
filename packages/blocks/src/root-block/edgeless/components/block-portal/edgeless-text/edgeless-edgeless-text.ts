import '../../../../../edgeless-text/edgeless-text-block.js';

import { css, html, type PropertyValueMap } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';

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
    .edgeless-text-block-container {
      position: absolute;
      padding: 10px;
      box-sizing: border-box;

      &[data-max-width='false'] .inline-editor span {
        word-break: normal !important;
        overflow-wrap: normal !important;
      }
    }
  `;

  @query('.edgeless-text-block-container')
  private accessor _textContainer!: HTMLDivElement;

  @state()
  private accessor _editing = false;

  private _horizontalResizing = false;

  private _resizeObserver = new ResizeObserver(() => {
    if (this._horizontalResizing) {
      const bound = Bound.deserialize(this.model.xywh);
      const rect = this._textContainer.getBoundingClientRect();
      // only update height, width updated by dragging
      bound.h = Math.max(
        rect.height / this.edgeless.service.zoom,
        EDGELESS_TEXT_BLOCK_MIN_HEIGHT
      );

      this.edgeless.doc.updateBlock(this.model, {
        xywh: bound.serialize(),
      });
    } else {
      this._updateXYWH();
    }
  });

  private _updateXYWH() {
    const bound = Bound.deserialize(this.model.xywh);
    const rect = this._textContainer.getBoundingClientRect();
    bound.w = Math.max(
      rect.width / this.edgeless.service.zoom,
      EDGELESS_TEXT_BLOCK_MIN_WIDTH
    );
    bound.h = Math.max(
      rect.height / this.edgeless.service.zoom,
      EDGELESS_TEXT_BLOCK_MIN_HEIGHT
    );
    this.edgeless.doc.updateBlock(this.model, {
      xywh: bound.serialize(),
    });
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
          } else if (
            selectedRect.dragDirection === HandleDirection.TopLeft ||
            selectedRect.dragDirection === HandleDirection.TopRight ||
            selectedRect.dragDirection === HandleDirection.BottomRight ||
            selectedRect.dragDirection === HandleDirection.BottomLeft
          ) {
            this._updateXYWH();
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

    const style: StyleInfo = {
      zIndex: `${index}`,
      left: `${bound.x}px`,
      top: `${bound.y}px`,
      transform: `scale(${scale})`,
      transformOrigin: '0 0',
      width: `${bound.w / scale}px`,
      height: `${bound.h / scale}px`,
    };
    if (this._editing) {
      if (!hasMaxWidth) {
        delete style.width;
      }
      delete style.height;
    } else if (this._horizontalResizing) {
      delete style.height;
    }

    return html`
      <div
        class="edgeless-text-block-container"
        style=${styleMap(style)}
        data-scale="${scale}"
        data-editing="${this._editing}"
        data-max-width="${hasMaxWidth}"
      >
        <div
          style=${styleMap({
            transform: `rotate(${rotate}deg)`,
            transformOrigin: 'center',
          })}
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
