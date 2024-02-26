import './componets/comment-panel.js';

import { WidgetElement } from '@blocksuite/lit';
import { css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { HighLightDuotoneIcon } from '../../_common/icons/text.js';
import { requestConnectedFrame } from '../../_common/utils/event.js';
import type { PDFBlockComponent } from '../pdf-block.js';
import { AnnotationType } from '../pdf-model.js';
import { isEmptyRange } from '../utils/selection.js';

export const AFFINE_PDF_ANNOTATION_TOOLBAR_WIDGET =
  'affine-pdf-annotation-toolbar';

@customElement('affine-pdf-annotation-toolbar')
export class AnnotationToolbar extends WidgetElement<PDFBlockComponent> {
  static override styles = css`
    .pdf-annotation-toolbar {
      position: absolute;

      box-sizing: border-box;
      padding: 4px 8px;
      height: 40px;
      width: max-content;
      gap: 4px;

      user-select: none;

      align-items: center;

      border-radius: 8px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      z-index: var(--affine-z-index-popover);
    }

    .pdf-annotation-toolbar icon-button {
      position: relative;
      width: 32px;
      height: 32px;
    }

    .highlight-rects {
      opacity: 0.5;
    }
  `;

  @state()
  private _display = false;

  @state()
  private _displayCommentPanel = false;

  @state()
  private _highlightInfo: {
    x: number;
    y: number;
    layerRect: DOMRect;
    highlightRects: DOMRect[];
    highlightText: string;
  } = {
    x: 0,
    y: 0,
    layerRect: new DOMRect(),
    highlightRects: [],
    highlightText: '',
  };

  private _onSelectionChange() {
    if (this._displayCommentPanel) return;

    const selection = document.getSelection();

    if (
      isEmptyRange(selection) ||
      !this.blockElement?.pdfTextLayer?.contains(selection.anchorNode) ||
      !this.blockElement?.pdfTextLayer?.contains(selection.focusNode)
    ) {
      this._display = false;
      this._displayCommentPanel = false;
      return;
    }

    const pdfTextLayerRect =
      this.blockElement.pdfTextLayer.getBoundingClientRect();
    const range = selection.getRangeAt(0);
    const rects = Array.from(range.getClientRects());
    const position = rects[0];

    this._highlightInfo = {
      x: position.x - pdfTextLayerRect.x,
      y: position.y - pdfTextLayerRect.y - 40,
      highlightRects: rects.map(
        rect =>
          new DOMRect(
            rect.x - pdfTextLayerRect.x,
            rect.y - pdfTextLayerRect.y,
            rect.width,
            rect.height
          )
      ),
      layerRect: pdfTextLayerRect,
      highlightText: selection.toString(),
    };
    this._display = true;
  }

  private _onCommentSubmit = (content: string) => {
    this._displayCommentPanel = false;
    this._display = false;

    const { highlightRects } = this._highlightInfo;

    this.blockElement.model.addAnnotation({
      type: AnnotationType.Text,
      highlightText: this._highlightInfo.highlightText,
      comment: content,
      highlightRects: {
        [this.blockElement.currentPage]: highlightRects.map(rect => [
          rect.x,
          rect.y,
          rect.width,
          rect.height,
        ]),
      },
    });
  };

  override connectedCallback() {
    super.connectedCallback();

    let rafId: number | null = null;
    this._disposables.addFromEvent(document, 'selectionchange', () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestConnectedFrame(() => {
        rafId = null;
        this._onSelectionChange();
      }, this);
    });
  }

  override render() {
    if (!this._display) {
      return nothing;
    }

    return html`<div
        class="pdf-annotation-toolbar"
        style=${styleMap({
          display: this._display ? 'flex' : undefined,
          top: `${this._highlightInfo.y}px`,
          left: `${this._highlightInfo.x}px`,
        })}
      >
        <icon-button
          class="highlight-icon"
          @click=${() => {
            this._displayCommentPanel = true;
          }}
        >
          ${HighLightDuotoneIcon}
          ${this._displayCommentPanel
            ? html`<annotation-comment-panel
                .onSubmit=${(content: string) => this._onCommentSubmit(content)}
                .onCancel=${() => {
                  this._display = false;
                  this._displayCommentPanel = false;
                }}
                .position=${{
                  x: this._highlightInfo.x,
                  y: this._highlightInfo.y + 40,
                }}
              ></annotation-comment-panel>`
            : nothing}
        </icon-button>
      </div>
      <div class="highlight-rects">
        ${repeat(
          this._highlightInfo.highlightRects,
          (_, i) => i,
          rect => html`
            <div
              style=${styleMap({
                position: 'absolute',
                top: `${rect.y}px`,
                left: `${rect.x}px`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
                background: 'gray',
                pointerEvents: 'none',
              })}
            ></div>
          `
        )}
        <div></div>
      </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-pdf-annotation-toolbar': AnnotationToolbar;
  }
}
