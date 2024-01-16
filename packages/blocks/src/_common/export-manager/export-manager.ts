import type { BlockService } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import type { BlockModel, Page } from '@blocksuite/store';

import {
  blockElementGetter,
  getBlockComponentByModel,
  getEditorContainer,
  isInsideDocEditor,
  matchFlavours,
} from '../../_common/utils/index.js';
import type { PageBlockModel } from '../../models.js';
import type { EdgelessPageBlockComponent } from '../../page-block/edgeless/edgeless-page-block.js';
import { getBlocksInFrame } from '../../page-block/edgeless/frame-manager.js';
import { xywhArrayToObject } from '../../page-block/edgeless/utils/convert.js';
import { getBackgroundGrid } from '../../page-block/edgeless/utils/query.js';
import type { IBound } from '../../surface-block/consts.js';
import type { ElementModel } from '../../surface-block/element-model/index.js';
import type { Renderer } from '../../surface-block/index.js';
import { Bound } from '../../surface-block/utils/bound.js';
import type { EdgelessBlock } from '../edgeless/mixin/index.js';
import { FileExporter } from './file-exporter.js';

type Html2CanvasFunction = typeof import('html2canvas').default;

export const DEFAULT_IMAGE_PROXY_ENDPOINT =
  'https://workers.toeverything.workers.dev/proxy/image';

export type ExportOptions = {
  imageProxyEndpoint: string;
};

const IGNORE_TAGS = [
  'AFFINE-BLOCK-HUB',
  'EDGELESS-TOOLBAR',
  'AFFINE-DRAG-HANDLE-WIDGET',
];

export class ExportManager {
  private _exportOptions: ExportOptions;
  private _blockService: BlockService;

  constructor(blockService: BlockService, options: ExportOptions) {
    this._exportOptions = options;
    this._blockService = blockService;
  }

  get page(): Page {
    return this._blockService.std.page;
  }

  get editorHost(): EditorHost {
    return this._blockService.std.host as EditorHost;
  }

  private async _checkReady() {
    const pathname = location.pathname;
    const pageMode = isInsideDocEditor(this.editorHost);

    const promise = new Promise((resolve, reject) => {
      let count = 0;
      const checkReactRender = setInterval(() => {
        try {
          this._checkCanContinueToCanvas(pathname, pageMode);
        } catch (e) {
          clearInterval(checkReactRender);
          reject(e);
        }
        const root = this.page.root;
        const pageBlock = root
          ? getBlockComponentByModel(this.editorHost, root)
          : null;
        const imageCard = pageBlock?.querySelector('affine-image-block-card');
        const isReady =
          !imageCard || imageCard.getAttribute('imageState') === '0';
        if (pageBlock && isReady) {
          clearInterval(checkReactRender);
          resolve(true);
        }
        count++;
        if (count > 10 * 60) {
          clearInterval(checkReactRender);
          resolve(false);
        }
      }, 100);
    });
    return await promise;
  }

  private _drawEdgelessBackground(
    ctx: CanvasRenderingContext2D,
    {
      size,
      backgroundColor,
      gridColor,
    }: {
      size: number;
      backgroundColor: string;
      gridColor: string;
    }
  ) {
    const svgImg = `<svg width='${ctx.canvas.width}px' height='${ctx.canvas.height}px' xmlns='http://www.w3.org/2000/svg' style='background-size:${size}px ${size}px;background-color:${backgroundColor}; background-image: radial-gradient(${gridColor} 1px, ${backgroundColor} 1px)'></svg>`;
    const img = new Image();
    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
    };

    return new Promise<void>((resolve, reject) => {
      img.onload = () => {
        cleanup();
        ctx.drawImage(img, 0, 0);
        resolve();
      };
      img.onerror = e => {
        cleanup();
        reject(e);
      };

      img.src = `data:image/svg+xml,${encodeURIComponent(svgImg)}`;
    });
  }

  private async _html2canvas(
    htmlElement: HTMLElement,
    options: Parameters<Html2CanvasFunction>[1] = {}
  ) {
    const html2canvas = (await import('html2canvas'))
      .default as unknown as Html2CanvasFunction;
    const html2canvasOption = {
      ignoreElements: function (element: Element) {
        if (
          element.tagName === 'AFFINE-BLOCK-HUB' ||
          element.tagName === 'EDGELESS-TOOLBAR' ||
          element.classList.contains('dg')
        ) {
          return true;
        } else {
          return false;
        }
      },
      onclone: async (documentClone: Document, element: HTMLElement) => {
        // html2canvas can't support transform feature
        element.style.setProperty('transform', 'none');
        const layer = element.classList.contains('.affine-edgeless-layer')
          ? element
          : null;

        if (layer instanceof HTMLElement) {
          layer.style.setProperty('transform', 'none');
        }

        const boxShadowEles = documentClone.querySelectorAll(
          "[style*='box-shadow']"
        );
        boxShadowEles.forEach(function (element) {
          if (element instanceof HTMLElement) {
            element.style.setProperty('box-shadow', 'none');
          }
        });

        await this._replaceRichTextWithSvgElement(element);
      },
      useCORS: this._exportOptions.imageProxyEndpoint ? false : true,
      proxy: this._exportOptions.imageProxyEndpoint,
    };

    return html2canvas(htmlElement, Object.assign(html2canvasOption, options));
  }

  private _createCanvas(bound: IBound, fillStyle: string) {
    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    canvas.width = (bound.w + 100) * dpr;
    canvas.height = (bound.h + 100) * dpr;

    ctx.scale(dpr, dpr);
    ctx.fillStyle = fillStyle;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    return { canvas, ctx };
  }

  public async edgelessToCanvas(
    surfaceRenderer: Renderer,
    bound: IBound,
    blockElementGetter: (model: BlockModel) => Element | null = () => null,
    edgeless?: EdgelessPageBlockComponent,
    nodes?: EdgelessBlock[],
    surfaces?: ElementModel[],
    edgelessBackground?: {
      zoom: number;
    }
  ): Promise<HTMLCanvasElement | undefined> {
    const root = this.page.root;
    if (!root) return;

    const pathname = location.pathname;
    const pageMode = isInsideDocEditor(this.editorHost);
    const editorContainer = getEditorContainer(this.editorHost);
    const containerComputedStyle = window.getComputedStyle(editorContainer);

    const html2canvas = (element: HTMLElement) =>
      this._html2canvas(element, {
        backgroundColor: containerComputedStyle.backgroundColor,
      });
    const container = editorContainer.querySelector(
      '.affine-block-children-container'
    );

    if (!container) return;

    const { ctx, canvas } = this._createCanvas(
      bound,
      window.getComputedStyle(container).backgroundColor
    );

    if (edgelessBackground) {
      await this._drawEdgelessBackground(ctx, {
        backgroundColor: containerComputedStyle.getPropertyValue(
          '--affine-background-primary-color'
        ),
        size: getBackgroundGrid(edgelessBackground.zoom, true).gap,
        gridColor: containerComputedStyle.getPropertyValue(
          '--affine-edgeless-grid-color'
        ),
      });
    }

    // TODO: refactor of this part
    const blocks =
      nodes ?? edgeless?.service.pickElementsByBound(bound, 'blocks') ?? [];
    for (const block of blocks) {
      if (matchFlavours(block, ['affine:image'])) {
        if (!block.sourceId) return;

        const blob = await block.page.blob.get(block.sourceId);
        if (!blob) return;

        const blobToImage = (blob: Blob) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
          });
        const blockBound = xywhArrayToObject(block);
        ctx.drawImage(
          await blobToImage(blob),
          blockBound.x - bound.x,
          blockBound.y - bound.y,
          blockBound.w,
          blockBound.h
        );
      }
      let blockElement = blockElementGetter(block)?.parentElement;
      if (matchFlavours(block, ['affine:note'])) {
        blockElement = blockElement?.closest('.edgeless-block-portal-note');
      }

      if (blockElement) {
        const blockBound = xywhArrayToObject(block);
        const canvasData = await this._html2canvas(blockElement as HTMLElement);
        ctx.drawImage(
          canvasData,
          blockBound.x - bound.x + 50,
          blockBound.y - bound.y + 50,
          blockBound.w,
          blockBound.h
        );
      }

      if (matchFlavours(block, ['affine:frame'])) {
        const blocksInsideFrame = getBlocksInFrame(this.page, block, false);
        const frameBound = Bound.deserialize(block.xywh);

        for (let i = 0; i < blocksInsideFrame.length; i++) {
          const element = blocksInsideFrame[i];
          const htmlElement = blockElementGetter(element);
          const blockBound = xywhArrayToObject(element);
          const canvasData = await html2canvas(htmlElement as HTMLElement);

          ctx.drawImage(
            canvasData,
            blockBound.x - bound.x + 50,
            blockBound.y - bound.y + 50,
            blockBound.w,
            (blockBound.w / canvasData.width) * canvasData.height
          );
        }
        const surfaceCanvas = surfaceRenderer.getCanvasByBound(frameBound);

        ctx.drawImage(surfaceCanvas, 50, 50, frameBound.w, frameBound.h);
      }

      this._checkCanContinueToCanvas(pathname, pageMode);
    }

    const surfaceCanvas = surfaceRenderer.getCanvasByBound(bound, surfaces);
    ctx.drawImage(surfaceCanvas, 50, 50, bound.w, bound.h);

    return canvas;
  }

  private async _docToCanvas(): Promise<HTMLCanvasElement | void> {
    const html2canvas = (await import('html2canvas')).default;
    if (!(html2canvas instanceof Function)) return;

    const pathname = location.pathname;
    const pageMode = isInsideDocEditor(this.editorHost);

    const editorContainer = getEditorContainer(this.editorHost);
    const docViewport = editorContainer.querySelector('.affine-doc-viewport');
    if (!docViewport) return;

    const pageContainer = docViewport.querySelector(
      '.affine-doc-page-block-container'
    );
    const rect = pageContainer?.getBoundingClientRect();
    const pageWidth = rect?.width;
    const pageLeft = rect?.left;
    const viewportHeight = docViewport?.scrollHeight;

    const replaceRichTextWithSvgElementFunc =
      this._replaceRichTextWithSvgElement.bind(this);
    const html2canvasOption = {
      ignoreElements: function (element: Element) {
        if (
          IGNORE_TAGS.includes(element.tagName) ||
          element.classList.contains('dg')
        ) {
          return true;
        } else if (
          (element.classList.contains('close') &&
            element.parentElement?.classList.contains(
              'meta-data-expanded-title'
            )) ||
          (element.classList.contains('expand') &&
            element.parentElement?.classList.contains('meta-data'))
        ) {
          // the close and expand buttons in affine-page-meta-data is not needed to be showed
          return true;
        } else {
          return false;
        }
      },
      onclone: async function (_documentClone: Document, element: HTMLElement) {
        element.style.height = `${viewportHeight}px`;
        await replaceRichTextWithSvgElementFunc(element);
      },
      backgroundColor: window.getComputedStyle(editorContainer).backgroundColor,
      x: pageLeft,
      width: pageWidth,
      height: viewportHeight,
      useCORS: this._exportOptions.imageProxyEndpoint ? false : true,
      proxy: this._exportOptions.imageProxyEndpoint,
    };

    const data = await html2canvas(
      docViewport as HTMLElement,
      html2canvasOption
    );
    this._checkCanContinueToCanvas(pathname, pageMode);
    return data;
  }

  private _replaceRichTextWithSvgElement = async (element: HTMLElement) => {
    const richList = Array.from(element.querySelectorAll('.inline-editor'));
    await Promise.all(
      richList.map(async rich => {
        const svgEle = await this._elementToSvgElement(
          rich.cloneNode(true) as HTMLElement,
          rich.clientWidth,
          rich.clientHeight + 1
        );
        rich.parentElement?.appendChild(svgEle);
        rich.parentElement?.removeChild(rich);
      })
    );
  };

  private async _elementToSvgElement(
    node: HTMLElement,
    width: number,
    height: number
  ) {
    const xmlns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(xmlns, 'svg');
    const foreignObject = document.createElementNS(xmlns, 'foreignObject');

    svg.setAttribute('width', `${width}`);
    svg.setAttribute('height', `${height}`);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    foreignObject.setAttribute('width', '100%');
    foreignObject.setAttribute('height', '100%');
    foreignObject.setAttribute('x', '0');
    foreignObject.setAttribute('y', '0');
    foreignObject.setAttribute('externalResourcesRequired', 'true');

    svg.appendChild(foreignObject);
    foreignObject.appendChild(node);
    return svg;
  }

  private _checkCanContinueToCanvas(pathName: string, pageMode: boolean) {
    if (
      location.pathname !== pathName ||
      isInsideDocEditor(this.editorHost) !== pageMode
    ) {
      throw new Error('Unable to export content to canvas');
    }
  }

  private async _toCanvas(): Promise<HTMLCanvasElement | void> {
    await this._checkReady();

    if (isInsideDocEditor(this.editorHost)) {
      return await this._docToCanvas();
    } else {
      const root = this.page.root;
      if (!root) return;

      const edgeless = getBlockComponentByModel(
        this.editorHost,
        root
      ) as EdgelessPageBlockComponent;
      const bound = edgeless.getElementsBound();
      assertExists(bound);
      return await this.edgelessToCanvas(
        edgeless.surface.renderer,
        bound,
        (model: BlockModel) => blockElementGetter(model, this.editorHost.view),
        edgeless
      );
    }
  }

  public async exportPng() {
    const root = this.page.root;
    if (!root) return;
    const canvasImage = await this._toCanvas();
    if (!canvasImage) {
      return;
    }

    FileExporter.exportPng(
      (this.page.root as PageBlockModel).title.toString(),
      canvasImage.toDataURL('image/png')
    );
  }

  public async exportPdf() {
    const root = this.page.root;
    if (!root) return;
    const canvasImage = await this._toCanvas();
    if (!canvasImage) {
      return;
    }

    const PDFLib = await import('pdf-lib');
    const pdfDoc = await PDFLib.PDFDocument.create();
    const page = pdfDoc.addPage([canvasImage.width, canvasImage.height]);
    const imageEmbed = await pdfDoc.embedPng(canvasImage.toDataURL('PNG'));
    const { width, height } = imageEmbed.scale(1);
    page.drawImage(imageEmbed, {
      x: 0,
      y: 0,
      width,
      height,
    });
    const pdfBase64 = await pdfDoc.saveAsBase64({ dataUri: true });

    FileExporter.exportFile(
      (root as PageBlockModel).title.toString() + '.pdf',
      pdfBase64
    );
  }
}
