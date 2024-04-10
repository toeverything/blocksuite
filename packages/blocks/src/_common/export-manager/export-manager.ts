import type { BlockService } from '@blocksuite/block-std';
import type { EditorHost } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockModel, Doc } from '@blocksuite/store';

import {
  blockElementGetter,
  getBlockComponentByModel,
  getRootByEditorHost,
  isInsidePageEditor,
  matchFlavours,
} from '../../_common/utils/index.js';
import type { EdgelessRootBlockComponent } from '../../root-block/edgeless/edgeless-root-block.js';
import { getBlocksInFrame } from '../../root-block/edgeless/frame-manager.js';
import type { EdgelessBlockModel } from '../../root-block/edgeless/type.js';
import { xywhArrayToObject } from '../../root-block/edgeless/utils/convert.js';
import { getBackgroundGrid } from '../../root-block/edgeless/utils/query.js';
import type { RootBlockModel } from '../../root-block/index.js';
import type { IBound } from '../../surface-block/consts.js';
import { ElementModel } from '../../surface-block/element-model/index.js';
import type { GroupElementModel, Renderer } from '../../surface-block/index.js';
import { Bound } from '../../surface-block/utils/bound.js';
import { fetchImage } from '../adapters/utils.js';
import { CANVAS_EXPROT_IGNORE_TAGS } from '../consts.js';
import { FileExporter } from './file-exporter.js';

type Html2CanvasFunction = typeof import('html2canvas').default;

export type ExportOptions = {
  imageProxyEndpoint: string;
};
export class ExportManager {
  private _exportOptions: ExportOptions;
  private _blockService: BlockService;

  constructor(blockService: BlockService, options: ExportOptions) {
    this._exportOptions = options;
    this._blockService = blockService;
  }

  get doc(): Doc {
    return this._blockService.std.doc;
  }

  get editorHost(): EditorHost {
    return this._blockService.std.host as EditorHost;
  }

  private async _checkReady() {
    const pathname = location.pathname;
    const editorMode = isInsidePageEditor(this.editorHost);

    const promise = new Promise((resolve, reject) => {
      let count = 0;
      const checkReactRender = setInterval(() => {
        try {
          this._checkCanContinueToCanvas(pathname, editorMode);
        } catch (e) {
          clearInterval(checkReactRender);
          reject(e);
        }
        const rootModel = this.doc.root;
        const rootElement = this.doc.root
          ? getBlockComponentByModel(this.editorHost, rootModel)
          : null;
        const imageCard = rootElement?.querySelector('affine-image-block-card');
        const isReady =
          !imageCard || imageCard.getAttribute('imageState') === '0';
        if (rootElement && isReady) {
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
    return promise;
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
          CANVAS_EXPROT_IGNORE_TAGS.includes(element.tagName) ||
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

        this._replaceRichTextWithSvgElement(element);
        await this.replaceImgSrcWithSvg(element);
      },
      useCORS: this._exportOptions.imageProxyEndpoint ? false : true,
      proxy: this._exportOptions.imageProxyEndpoint,
    };

    let data: HTMLCanvasElement;
    try {
      this._enableMediaPrint();
      data = await html2canvas(
        htmlElement,
        Object.assign(html2canvasOption, options)
      );
    } finally {
      this._disableMediaPrint();
    }
    return data;
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

  // TODO: refactor of this part
  public async edgelessToCanvas(
    surfaceRenderer: Renderer,
    bound: IBound,
    blockElementGetter: (model: BlockModel) => Element | null = () => null,
    edgeless?: EdgelessRootBlockComponent,
    nodes?: EdgelessBlockModel[],
    surfaces?: ElementModel[],
    edgelessBackground?: {
      zoom: number;
    }
  ): Promise<HTMLCanvasElement | undefined> {
    const rootModel = this.doc.root;
    if (!rootModel) return;

    const pathname = location.pathname;
    const editorMode = isInsidePageEditor(this.editorHost);
    const rootElement = getRootByEditorHost(this.editorHost);
    assertExists(rootElement);
    const viewportElement = rootElement.viewportElement;

    const containerComputedStyle = window.getComputedStyle(viewportElement);

    const html2canvas = (element: HTMLElement) =>
      this._html2canvas(element, {
        backgroundColor: containerComputedStyle.backgroundColor,
      });
    const container = rootElement.querySelector(
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

    const blocks =
      nodes ?? edgeless?.service.pickElementsByBound(bound, 'blocks') ?? [];
    for (const block of blocks) {
      if (matchFlavours(block, ['affine:image'])) {
        if (!block.sourceId) return;

        const blob = await block.doc.blob.get(block.sourceId);
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
        const blocksInsideFrame = getBlocksInFrame(this.doc, block, false);
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

      this._checkCanContinueToCanvas(pathname, editorMode);
    }

    if (surfaces?.length) {
      const surfaceElements = surfaces.flatMap(element =>
        element.type === 'group'
          ? ((element as GroupElementModel).childElements.filter(
              el => el instanceof ElementModel
            ) as ElementModel[])
          : element
      );
      const surfaceCanvas = surfaceRenderer.getCanvasByBound(
        bound,
        surfaceElements
      );

      ctx.drawImage(surfaceCanvas, 50, 50, bound.w, bound.h);
    }

    return canvas;
  }

  private async _docToCanvas(): Promise<HTMLCanvasElement | void> {
    const html2canvas = (await import('html2canvas')).default;
    if (!(html2canvas instanceof Function)) return;

    const pathname = location.pathname;
    const editorMode = isInsidePageEditor(this.editorHost);

    const rootElement = getRootByEditorHost(this.editorHost);
    assertExists(rootElement);
    const viewportElement = rootElement.viewportElement;

    const pageContainer = viewportElement.querySelector(
      '.affine-page-root-block-container'
    );
    const rect = pageContainer?.getBoundingClientRect();
    const { viewport } = rootElement;
    const pageWidth = rect?.width;
    const pageLeft = rect?.left ?? 0;
    const viewportHeight = viewportElement?.scrollHeight;

    const html2canvasOption = {
      ignoreElements: function (element: Element) {
        if (
          CANVAS_EXPROT_IGNORE_TAGS.includes(element.tagName) ||
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
          // the close and expand buttons in affine-doc-meta-data is not needed to be showed
          return true;
        } else {
          return false;
        }
      },
      onclone: async (_documentClone: Document, element: HTMLElement) => {
        element.style.height = `${viewportHeight}px`;
        this._replaceRichTextWithSvgElement(element);
        await this.replaceImgSrcWithSvg(element);
      },
      backgroundColor: window.getComputedStyle(viewportElement).backgroundColor,
      x: pageLeft - viewport.left,
      width: pageWidth,
      height: viewportHeight,
      useCORS: this._exportOptions.imageProxyEndpoint ? false : true,
      proxy: this._exportOptions.imageProxyEndpoint,
    };

    let data: HTMLCanvasElement;
    try {
      this._enableMediaPrint();
      data = await html2canvas(
        viewportElement as HTMLElement,
        html2canvasOption
      );
    } finally {
      this._disableMediaPrint();
    }
    this._checkCanContinueToCanvas(pathname, editorMode);
    return data;
  }

  private _replaceRichTextWithSvgElement = (element: HTMLElement) => {
    const richList = Array.from(element.querySelectorAll('.inline-editor'));
    richList.map(rich => {
      const svgEle = this._elementToSvgElement(
        rich.cloneNode(true) as HTMLElement,
        rich.clientWidth,
        rich.clientHeight + 1
      );
      rich.parentElement?.append(svgEle);
      rich.remove();
    });
  };

  private _enableMediaPrint() {
    document.querySelectorAll('.media-print').forEach(mediaPrint => {
      mediaPrint.classList.remove('hide');
    });
  }

  private _disableMediaPrint() {
    document.querySelectorAll('.media-print').forEach(mediaPrint => {
      mediaPrint.classList.add('hide');
    });
  }

  private _elementToSvgElement(
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

    svg.append(foreignObject);
    foreignObject.append(node);
    return svg;
  }

  private _checkCanContinueToCanvas(pathName: string, editorMode: boolean) {
    if (
      location.pathname !== pathName ||
      isInsidePageEditor(this.editorHost) !== editorMode
    ) {
      throw new Error('Unable to export content to canvas');
    }
  }

  private async _toCanvas(): Promise<HTMLCanvasElement | void> {
    await this._checkReady();

    if (isInsidePageEditor(this.editorHost)) {
      return this._docToCanvas();
    } else {
      const rootModel = this.doc.root;
      if (!rootModel) return;

      const edgeless = getBlockComponentByModel(
        this.editorHost,
        rootModel
      ) as EdgelessRootBlockComponent;
      const bound = edgeless.getElementsBound();
      assertExists(bound);
      return this.edgelessToCanvas(
        edgeless.surface.renderer,
        bound,
        (model: BlockModel) => blockElementGetter(model, this.editorHost.view),
        edgeless
      );
    }
  }

  public async exportPng() {
    const rootModel = this.doc.root;
    if (!rootModel) return;
    const canvasImage = await this._toCanvas();
    if (!canvasImage) {
      return;
    }

    FileExporter.exportPng(
      (this.doc.root as RootBlockModel).title.toString(),
      canvasImage.toDataURL('image/png')
    );
  }

  public replaceImgSrcWithSvg = async (element: HTMLElement) => {
    const imgList = Array.from(element.querySelectorAll('img'));
    // Create an array of promises
    const promises = imgList.map(img => {
      return fetchImage(
        img.src,
        undefined,
        this._exportOptions.imageProxyEndpoint
      )
        .then(response => response.blob())
        .then(async blob => {
          // If the file type is SVG, set svg width and height
          if (blob.type === 'image/svg+xml') {
            // Parse the SVG
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(
              await blob.text(),
              'image/svg+xml'
            );
            const svgElement =
              svgDoc.documentElement as unknown as SVGSVGElement;

            // Check if the SVG has width and height attributes
            if (
              !svgElement.hasAttribute('width') &&
              !svgElement.hasAttribute('height')
            ) {
              // Get the viewBox
              const viewBox = svgElement.viewBox.baseVal;
              // Set the SVG width and height
              svgElement.setAttribute('width', `${viewBox.width}px`);
              svgElement.setAttribute('height', `${viewBox.height}px`);
            }

            // Replace the img src with the modified SVG
            const serializer = new XMLSerializer();
            const newSvgStr = serializer.serializeToString(svgElement);
            img.src =
              'data:image/svg+xml;charset=utf-8,' +
              encodeURIComponent(newSvgStr);
          }
        });
    });

    // Wait for all promises to resolve
    await Promise.all(promises);
  };

  public async exportPdf() {
    const rootModel = this.doc.root;
    if (!rootModel) return;
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
      (rootModel as RootBlockModel).title.toString() + '.pdf',
      pdfBase64
    );
  }
}
