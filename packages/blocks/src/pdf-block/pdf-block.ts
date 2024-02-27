import { BlockElement } from '@blocksuite/lit';
import { css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { PDFDocumentProxy } from 'pdfjs-dist';

import {
  FrameNavigatorNextIcon,
  FrameNavigatorPrevIcon,
} from '../_common/icons/edgeless.js';
import type { EdgelessPageService } from '../page-block/edgeless/edgeless-page-service.js';
import type { PageService } from '../page-block/page-service.js';
import type { PDFBlockModel } from './pdf-model.js';
import { PDFService } from './pdf-service.js';
import { PDFException } from './pdf-service.js';

export type PageChangeEvent = CustomEvent<{ page: number }>;

type PDFStatus =
  | 'loaded'
  | 'module-failed'
  | 'file-failed'
  | 'render-failed'
  | 'loading';

const getUserFriendlyInfo = (status: PDFStatus) => {
  switch (status) {
    case 'module-failed':
      return 'Failed at loading PDF module';
    case 'file-failed':
      return 'Failed at loading file';
    case 'render-failed':
      return 'Failed at rendering PDF';
    default:
      return '';
  }
};

@customElement('affine-pdf')
export class PDFBlockComponent extends BlockElement<PDFBlockModel, PDFService> {
  static RENDERING_SCALE = 2;
  static override styles = css`
    .affine-pdf-block {
      position: relative;
    }

    .pdf-renderer-container {
      text-align: center;
      position: relative;

      isolation: isolate;
    }

    .pdf-canvas {
      display: block;
      font-size: 1px;
    }

    .pdf-annotation-canvas {
      display: block;

      position: absolute;
      left: 0;
      top: 0;

      opacity: 0.5;
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
      z-index: 3;
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

  private _status: PDFStatus = 'loading';
  private _pdfDoc!: PDFDocumentProxy;

  @state()
  private _pdfPageNum = 1;

  @query('.pdf-renderer-container')
  rendererConatiner!: HTMLDivElement;

  @query('.pdf-canvas')
  pdfCanvas!: HTMLCanvasElement;

  @query('.pdf-textlayer')
  pdfTextLayer!: HTMLDivElement;

  @query('.pdf-annotation-canvas')
  pdfAnnotationCanvas!: HTMLCanvasElement;

  @query('.affine-pdf-block')
  pdfContainer!: HTMLDivElement;

  private _pdfLayerRect: DOMRect | null = null;

  get currentPage() {
    return this._pdfPageNum;
  }

  get pageService() {
    return this.std.spec.getService('affine:page') as
      | PageService
      | EdgelessPageService;
  }

  private async _setupPDF() {
    if (!this.service.moduleLoaded) return;

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
      this._renderAnnotation();
    } catch (e) {
      console.error(e);
      this._status = 'render-failed';
    } finally {
      this.isConnected && this.requestUpdate();
    }
  }

  private _renderAnnotation() {
    const annotations = this.model.getAnnotationsByPage(this._pdfPageNum);
    const { pdfAnnotationCanvas, pdfCanvas } = this;
    const context = pdfAnnotationCanvas.getContext('2d')!;

    context.clearRect(
      0,
      0,
      pdfAnnotationCanvas.width,
      pdfAnnotationCanvas.height
    );

    if (!annotations.length) return;

    if (pdfAnnotationCanvas.width !== pdfCanvas.width) {
      pdfAnnotationCanvas.width = pdfCanvas.width;
      pdfAnnotationCanvas.height = pdfCanvas.height;
    }

    pdfAnnotationCanvas.style.width = pdfCanvas.style.width;
    pdfAnnotationCanvas.style.height = pdfCanvas.style.height;

    const renderingScale =
      pdfAnnotationCanvas.width /
        parseInt(pdfAnnotationCanvas.style.width.replace('px', '')) ?? 1;
    context.fillStyle = 'rgba(255, 255, 0, 1)';

    annotations.forEach(({ annotation }) => {
      const rects = annotation.get('highlightRects')?.[this._pdfPageNum] ?? [];

      rects.forEach(([x, y, w, h]) => {
        context.fillRect(
          x * renderingScale,
          y * renderingScale,
          w * renderingScale,
          h * renderingScale
        );
      });
    });
  }

  private _setPage(num: number) {
    if (num < 1 || num > this._pdfDoc.numPages) return;

    this._pdfPageNum = num;
    this._renderPage(num).catch(() => {});
    this.dispatchEvent(
      new CustomEvent('pagechange', {
        detail: {
          page: num,
        },
      })
    );
  }

  private _prev() {
    if (this._pdfPageNum === 1) return;

    this._setPage(this._pdfPageNum - 1);
  }

  private _next() {
    if (this._pdfPageNum === this._pdfDoc.numPages) return;

    this._setPage(this._pdfPageNum + 1);
  }

  toPDFCoords(x: number, y: number) {
    this._pdfLayerRect = this.pdfCanvas.getBoundingClientRect();

    if ('viewport' in this.pageService) {
      const zoom = this.pageService.viewport.zoom;

      return {
        x: (x - this._pdfLayerRect.x) / zoom,
        y: (y - this._pdfLayerRect.y) / zoom,
      };
    }

    return {
      x: x - this._pdfLayerRect.x,
      y: y - this._pdfLayerRect.y,
    };
  }

  override connectedCallback() {
    super.connectedCallback();

    this._disposables.add(
      PDFService.moduleUpdated.on(() => {
        this.requestUpdate();

        if (this._status !== 'loaded') {
          this._setupPDF().catch(() => {});
        }
      })
    );
    this._disposables.add(
      this.model.annotationUpdated.on(() => {
        this._renderAnnotation();
      })
    );
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
    if (!this.service.moduleLoaded) {
      return html`<div class="affine-pdf-block">PDF module is not loaded</div>`;
    }

    const widgets = html`${repeat(
      Object.entries(this.widgets),
      ([id]) => id,
      ([_, widget]) => widget
    )}`;

    switch (this._status) {
      case 'module-failed':
      case 'file-failed':
      case 'render-failed':
        return html`<div class="affine-pdf-block">
          Failed to render PDF (Detail: ${getUserFriendlyInfo(this._status)})
        </div>`;
    }

    return html`<div class="affine-pdf-block">
      <div class="pdf-renderer-container">
        <canvas class="pdf-canvas"></canvas>
        <canvas class="pdf-annotation-canvas"></canvas>
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
      ${widgets}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-pdf': PDFBlockComponent;
  }
}
