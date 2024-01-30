import { BlockElement } from '@blocksuite/lit';
import { css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import type { PDFDocumentProxy } from 'pdfjs-dist';

import {
  FrameNavigatorNextIcon,
  FrameNavigatorPrevIcon,
} from '../_common/icons/edgeless.js';
import type { PDFBlockModel } from './pdf-model.js';
import { PDFException, type PDFService } from './pdf-service.js';

@customElement('affine-pdf')
export class PDFBlockComponent extends BlockElement<PDFBlockModel, PDFService> {
  static override styles = css`
    .affine-pdf-block {
      position: relative;
    }

    .affine-pdf-canvas-container {
      text-align: center;
    }

    .pdf-pagination {
      display: none;

      position: absolute;
      bottom: 0;
      right: 0;
      left: 0;
      line-height: 1;
      padding: 0.5rem;
      background-color: rgba(0, 0, 0, 0.5);
      color: white;
      font-size: 0.75rem;
      user-select: none;
    }

    .affine-pdf-block:hover .pdf-pagination {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    .page-btn {
      background: none;
      border: none;
      width: 16px;
      height: 16px;
      color: var(--affine-white);
      padding: 0;
    }

    .page-btn svg {
      width: 16px;
      height: 16px;
    }
  `;

  private _status:
    | 'loaded'
    | 'module-failed'
    | 'file-failed'
    | 'render-failed'
    | 'loading' = 'loading';
  private _blob!: Blob;
  private _pdfDoc!: PDFDocumentProxy;

  @state()
  private _pdfPageNum = 1;

  @query('.pdf-canvas')
  pdfCanvas!: HTMLCanvasElement;

  override get service() {
    return super.service as PDFService;
  }

  private async _renderPage(num: number) {
    try {
      const pdfPage = await this._pdfDoc.getPage(num);
      const viewport = pdfPage.getViewport({ scale: 2 });
      const context = this.pdfCanvas.getContext('2d')!;

      this.pdfCanvas.height = viewport.height;
      this.pdfCanvas.width = viewport.width;
      this.pdfCanvas.style.height = `${viewport.height / 2}px`;
      this.pdfCanvas.style.width = `${viewport.width / 2}px`;

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      await pdfPage.render(renderContext).promise;
    } catch (e) {
      console.error(e);
      this._status = 'render-failed';
    } finally {
      this.isConnected && this.requestUpdate();
    }
  }

  private async _setupPDF() {
    const blob = await this.page.blob.get(this.model.sourceId);

    if (!blob) {
      this._status = 'file-failed';
      return;
    }

    this._blob = blob;

    try {
      const pdfDoc = await this.service.parsePDF(URL.createObjectURL(blob));

      if (!this.isConnected || !this.pdfCanvas) return;

      this._pdfDoc = pdfDoc;

      await this._renderPage(1);
    } catch (err) {
      this._status =
        err instanceof PDFException
          ? err.type === 'module'
            ? 'module-failed'
            : 'file-failed'
          : 'render-failed';

      console.error(err);
    } finally {
      this.isConnected && this.requestUpdate();
    }
  }

  private _prev() {
    if (this._pdfPageNum === 1) return;

    this._renderPage(--this._pdfPageNum).catch(() => {});
  }

  private _next() {
    if (this._pdfPageNum === this._pdfDoc.numPages) return;

    this._renderPage(++this._pdfPageNum).catch(() => {});
  }

  override firstUpdated() {
    this._setupPDF().catch(() => {});
  }

  override render() {
    if (this._status !== 'loaded' && this._status !== 'loading') {
      return html`<div class="affine-pdf-block">${'Failed to load PDF'}</div>`;
    }

    return html`<div class="affine-pdf-block">
      <div class="affine-pdf-canvas-container">
        <canvas class="pdf-canvas"></canvas>
      </div>
      ${this._pdfDoc
        ? html`<div class="pdf-pagination">
            <button class="page-btn" type="button" @click=${this._prev}>
              ${FrameNavigatorPrevIcon}
            </button>
            ${this._pdfPageNum} / ${this._pdfDoc.numPages}
            <button class="page-btn" type="button" @click=${this._next}>
              ${FrameNavigatorNextIcon}
            </button>
          </div>`
        : nothing}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-pdf': PDFBlockComponent;
  }
}
