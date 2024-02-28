import './componets/comment-panel.js';

import { WidgetElement } from '@blocksuite/lit';
import { css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { HighLightDuotoneIcon } from '../../_common/icons/text.js';
import { requestConnectedFrame } from '../../_common/utils/event.js';
import type { EdgelessPageService, PageService } from '../../index.js';
import type { PDFBlockComponent } from '../pdf-block.js';
import { AnnotationType } from '../pdf-model.js';

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
    highlightRects: { x: number; y: number; w: number; h: number }[];
    highlightText: string;
  } = {
    x: 0,
    y: 0,
    layerRect: new DOMRect(),
    highlightRects: [],
    highlightText: '',
  };

  get pageService() {
    return this.blockElement.std.spec.getService('affine:page') as
      | PageService
      | EdgelessPageService;
  }

  private _onSelectionChange() {
    if (this._displayCommentPanel) return;

    const selection = document.getSelection();
    const range = selection?.type === 'Range' ? selection?.getRangeAt(0) : null;

    if (
      !range ||
      !this.blockElement.pdfTextLayer.contains(range.commonAncestorContainer)
    ) {
      this._display = false;
      this._displayCommentPanel = false;
      return;
    }

    const pdfTextLayerRect =
      this.blockElement.pdfTextLayer.getBoundingClientRect();
    const rects = Array.from(range.getClientRects())
      .filter((current, idx, rects) => {
        if (current.width === 0 || current.height === 0) return false;
        if (idx === 0) return true;

        const previous = rects[idx - 1]!;

        return (
          current.x !== previous.x ||
          current.y !== previous.y ||
          current.width !== previous.width ||
          current.height !== previous.height
        );
      })
      .map(rect => ({
        x: rect.x - pdfTextLayerRect.x,
        y: rect.y - pdfTextLayerRect.y,
        w: rect.width,
        h: rect.height,
      }));

    if ('viewport' in this.pageService) {
      const zoom = this.pageService.viewport.zoom;

      rects.forEach(rect => {
        rect.x /= zoom;
        rect.y /= zoom;
        rect.w /= zoom;
        rect.h /= zoom;
      });
    }

    const position = rects[0];

    this._highlightInfo = {
      x: position.x,
      y: position.y - 40,
      highlightRects: rects,
      layerRect: pdfTextLayerRect,
      highlightText: selection!.toString(),
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
          rect.w,
          rect.h,
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
                width: `${rect.w}px`,
                height: `${rect.h}px`,
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
