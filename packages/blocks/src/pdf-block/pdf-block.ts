import { BlockElement } from '@blocksuite/lit';
import { css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import type { PDFDocumentProxy } from 'pdfjs-dist';

import {
  FrameNavigatorNextIcon,
  FrameNavigatorPrevIcon,
} from '../_common/icons/edgeless.js';
import type { PDFBlockModel } from './pdf-model.js';
import type { PDFService } from './pdf-service.js';
import { PDFException } from './pdf-service.js';

@customElement('affine-pdf')
export class PDFBlockComponent extends BlockElement<PDFBlockModel, PDFService> {
  static RENDERING_SCALE = 2;
  static override styles = css`
    .affine-pdf-block {
      position: relative;
    }

    .pdf-renderer-container {
      text-align: center;
    }

    .pdf-canvas {
      display: block;
      font-size: 1px;
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
  private _pdfDoc!: PDFDocumentProxy;

  @state()
  private _pdfPageNum = 1;

  @query('.pdf-renderer-container')
  rendererConatiner!: HTMLDivElement;

  @query('.pdf-canvas')
  pdfCanvas!: HTMLCanvasElement;

  @query('.pdf-textlayer')
  pdfTextLayer!: HTMLDivElement;

  private async _renderPage(num: number) {
    try {
      const { RENDERING_SCALE } = PDFBlockComponent;
      const pdfPage = await this._pdfDoc.getPage(num);
      const viewport = pdfPage.getViewport({ scale: RENDERING_SCALE });
      const pdfCanvas = this.pdfCanvas;
      const context = pdfCanvas.getContext('2d')!;
      const container = pdfCanvas.parentElement!;
      const width = container.clientWidth;
      const height = width * (viewport.height / viewport.width);

      pdfCanvas.height = viewport.height;
      pdfCanvas.width = viewport.width;
      pdfCanvas.style.height = `${height}px`;
      pdfCanvas.style.width = `${width}px`;

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      await pdfPage.render(renderContext).promise;
      const TextLayerBuilder = await this.service.TextLayerBuilder;
      const textContent = await pdfPage.getTextContent();
      const textLayer = new TextLayerBuilder({});
      const textLayerViewport = pdfPage.getViewport({ scale: 1 });

      textLayer.div.classList.add('pdf-textlayer');
      textLayer.div.style.setProperty(
        '--scale-factor',
        `${height / textLayerViewport.height}`
      );
      textLayer.onAppend = (div: HTMLDivElement) =>
        this.rendererConatiner.append(div);
      textLayer.setTextContentSource(textContent);
      await textLayer.render(textLayerViewport);
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

  override update(changeProperties: Map<string | number | symbol, unknown>) {
    if (changeProperties.has('_pdfPageNum')) {
      this.pdfTextLayer?.remove();
    }

    super.update(changeProperties);
  }

  override render() {
    if (this._status !== 'loaded' && this._status !== 'loading') {
      return html`<div class="affine-pdf-block">${'Failed to load PDF'}</div>`;
    }

    return html`<div class="affine-pdf-block">
      <div class="pdf-renderer-container">
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
