import { BlockElement } from '@blocksuite/lit';
import { css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import type { PDFDocumentProxy } from 'pdfjs-dist';

import type { PDFBlockModel } from './pdf-model.js';
import { PDFException, type PDFService } from './pdf-service.js';

@customElement('affine-pdf')
export class PDFBlockComponent extends BlockElement<PDFBlockModel, PDFService> {
  static override styles = css`
    .affine-pdf-canvas-container {
      position: relative;
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
      text-align: right;
    }

    .affine-pdf-canvas-container:hover .pdf-pagination {
      display: block;
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

  private async _initPDF() {
    const blob = await this.page.blob.get(this.model.sourceId);

    if (!blob) {
      this._status = 'file-failed';
      return;
    }

    this._blob = blob;

    try {
      const pdfDoc = await this.service.parsePDF(URL.createObjectURL(blob));
      const pdfPage = await pdfDoc.getPage(1);

      if (!this.isConnected || !this.pdfCanvas) return;

      this._pdfDoc = pdfDoc;

      const viewport = pdfPage.getViewport({ scale: 1 });
      const context = this.pdfCanvas.getContext('2d')!;

      this.pdfCanvas.height = viewport.height;
      this.pdfCanvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      await pdfPage.render(renderContext).promise;
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

  override firstUpdated() {
    this._initPDF().catch(() => {});
  }

  override render() {
    if (this._status !== 'loaded' && this._status !== 'loading') {
      return html`<div class="affine-pdf-block">${'Failed to load PDF'}</div>`;
    }

    return html`<div class="affine-pdf-block">
      <div class="affine-pdf-canvas-container">
        <canvas class="pdf-canvas"></canvas>
        ${this._pdfDoc
          ? html`<div class="pdf-pagination">
              ${this._pdfPageNum}/${this._pdfDoc.numPages}
            </div>`
          : nothing}
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-pdf': PDFBlockComponent;
  }
}
