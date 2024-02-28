import { WidgetElement } from '@blocksuite/lit';
import { limitShift, offset, shift } from '@floating-ui/dom';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { HoverController } from '../../_common/components/hover/controller.js';
import { HighLightDuotoneIcon } from '../../_common/icons/text.js';
import type { PDFBlockComponent } from '../pdf-block.js';
import { AnnotationType } from '../type.js';

export const AFFINE_PDF_TOOLBAR_WIDGET = 'affine-pdf-toolbar-widget';

@customElement('affine-pdf-toolbar-widget')
export class AffinePDFToolbarWidget extends WidgetElement<PDFBlockComponent> {
  static override styles = css`
    .clip-annotation-rect {
      position: absolute;
      border: 2px dashed blue;
      pointer-events: none;
    }
  `;
  private _hoverController = new HoverController(
    this,
    ({ abortController }) => {
      const pdfBlockElement = this.blockElement;

      return {
        template: this.toolbarTemplate(abortController),
        computePosition: {
          referenceElement: pdfBlockElement.pdfContainer,
          placement: 'right-start',
          middleware: [
            offset({
              mainAxis: 12,
              crossAxis: 10,
            }),
            shift({
              crossAxis: true,
              padding: {
                top: 12,
                bottom: 12,
                right: 12,
              },
              limiter: limitShift(),
            }),
          ],
          autoUpdate: true,
        },
      };
    }
  );

  @state()
  private _drawingRect: null | {
    x: number;
    y: number;
    width: number;
    height: number;
  } = null;

  @state()
  private _showCommentPanel = false;

  private _createClipAnnotation(content: string) {
    const highlightRect = this._drawingRect!;

    this._clearAnnotationEditingState();

    this.blockElement.model.addAnnotation({
      type: AnnotationType.Clip,
      comment: content,
      highlightRects: {
        [this.blockElement.currentPage]: [
          [
            highlightRect.x,
            highlightRect.y,
            highlightRect.width,
            highlightRect.height,
          ],
        ],
      },
    });
  }

  private _clearAnnotationEditingState = () => {
    this._drawingRect = null;
    this._showCommentPanel = false;
    this.blockElement.enableTextSelection(true);
  };

  private _onClipCommentCreated = () => {
    const showCommentPanel = () => {
      this._showCommentPanel = true;
    };
    const dispose = this._disposables.addFromEvent(
      this.blockElement.pdfContainer,
      'pointerdown',
      e => {
        const pos = this.blockElement.toPDFCoords(e.clientX, e.clientY);
        this.blockElement.enableTextSelection(false);

        this._drawingRect = {
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
        };

        const disposeMoveEvent = this._disposables.addFromEvent(
          this.blockElement.ownerDocument,
          'pointermove',
          e => {
            const pos = this.blockElement.toPDFCoords(e.clientX, e.clientY);

            this._drawingRect!.width = pos.x - this._drawingRect!.x;
            this._drawingRect!.height = pos.y - this._drawingRect!.y;
            this.requestUpdate('_drawingRect');
          }
        );
        const disposeUpEvent = this._disposables.addFromEvent(
          this.blockElement.ownerDocument,
          'pointerup',
          () => {
            disposeMoveEvent();
            disposeUpEvent();
            showCommentPanel();
          }
        );

        dispose();
      }
    );
  };

  toolbarTemplate(abortController: AbortController) {
    return html`<affine-pdf-toolbar
      .abortController=${abortController}
      .onClipCommentCreated=${() => {
        this._onClipCommentCreated();
      }}
    ></affine-pdf-toolbar>`;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._hoverController.setReference(this.blockElement);
  }

  override render() {
    if (!this._drawingRect) {
      return nothing;
    }

    const { x, y, width, height } = this._drawingRect;

    return html`<div class="affine-pdf-toolbar-widget">
      <div
        class="clip-annotation-rect"
        style=${styleMap({
          left: `${x}px`,
          top: `${y}px`,
          width: `${width}px`,
          height: `${height}px`,
        })}
      ></div>
      ${this._showCommentPanel
        ? html`<annotation-comment-panel
            .onSubmit=${(content: string) => {
              this._createClipAnnotation(content);
            }}
            .onCancel=${() => {
              this._clearAnnotationEditingState();
            }}
            .position=${{
              x: x + width,
              y: y + height / 2,
            }}
          ></annotation-comment-panel>`
        : nothing}
    </div>`;
  }
}

@customElement('affine-pdf-toolbar')
export class PDFToolbar extends LitElement {
  static override styles = css`
    .affine-pdf-toolbar {
      display: flex;
      flex-direction: column;
      gap: 4px;

      padding: 4px 8px;

      align-items: center;

      border-radius: 8px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
    }

    .affine-pdf-toolbar icon-button {
      position: relative;
      width: 32px;
      height: 32px;
    }
  `;

  @property({ attribute: false })
  onClipCommentCreated!: () => void;

  @property({ attribute: false })
  abortController!: AbortController;

  private _onClipCommentCreated = () => {
    this.onClipCommentCreated?.();
    this.abortController?.abort();
  };

  override render() {
    return html`<div class="affine-pdf-toolbar">
      <icon-button @click=${this._onClipCommentCreated}
        >${HighLightDuotoneIcon}</icon-button
      >
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_PDF_TOOLBAR_WIDGET]: AffinePDFToolbarWidget;
    'affine-pdf-toolbar': PDFToolbar;
  }
}
