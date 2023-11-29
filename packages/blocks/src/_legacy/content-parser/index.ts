import { assertExists, Slot } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { nanoid } from '@blocksuite/store';
import { marked } from 'marked';

import { getTagColor } from '../../_common/components/tags/colors.js';
import { toast } from '../../_common/components/toast.js';
import {
  getBlockElementByModel,
  getEditorContainer,
  isPageMode,
  type SerializedBlock,
  type TopLevelBlockModel,
} from '../../_common/utils/index.js';
import { humanFileSize } from '../../_common/utils/math.js';
import type { AttachmentBlockProps } from '../../attachment-block/attachment-model.js';
import type { Renderer } from '../../index.js';
import type { PageBlockModel } from '../../models.js';
import type { EdgelessPageBlockComponent } from '../../page-block/edgeless/edgeless-page-block.js';
import { getBlocksInFrame } from '../../page-block/edgeless/frame-manager.js';
import { xywhArrayToObject } from '../../page-block/edgeless/utils/convert.js';
import { getBackgroundGrid } from '../../page-block/edgeless/utils/query.js';
import type { IBound } from '../../surface-block/consts.js';
import { EdgelessBlockType } from '../../surface-block/edgeless-types.js';
import type { SurfaceElement } from '../../surface-block/elements/surface-element.js';
import { Bound } from '../../surface-block/utils/bound.js';
import { FileExporter } from './file-exporter/file-exporter.js';
import type {
  FetchFileHandler,
  TableParseHandler,
  TableTitleColumnHandler,
  TextStyleHandler,
} from './parse-base.js';
import { MarkdownParser } from './parse-markdown.js';
import { NotionHtmlParser } from './parse-notion-html.js';
import type { SelectedBlock } from './types.js';

type Html2CanvasFunction = typeof import('html2canvas').default;
type ParseContext = 'Markdown' | 'NotionHtml';

export type ParseHtml2BlockHandler = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => Promise<SerializedBlock[] | null>;

export type ContextedContentParser = {
  context: string;
  getParserHtmlText2Block: (name: string) => ParseHtml2BlockHandler;
};

export class ContentParser {
  private _page: Page;
  readonly slots = {
    beforeHtml2Block: new Slot<Element>(),
  };
  private _parsers: Record<string, ParseHtml2BlockHandler> = {};
  private _imageProxyEndpoint?: string;
  private _markdownParser: MarkdownParser;
  private _notionHtmlParser: NotionHtmlParser;
  private urlPattern =
    /(?<=\s|^)https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)(?=\s|$)/g;
  constructor(
    page: Page,
    options: {
      /** API endpoint used for cross-domain image export */
      imageProxyEndpoint?: string;
      fetchFileHandler?: FetchFileHandler;
      textStyleHandler?: TextStyleHandler;
      tableParseHandler?: TableParseHandler;
      tableTitleColumnHandler?: TableTitleColumnHandler;
    } = {}
  ) {
    this._page = page;
    this._imageProxyEndpoint = options?.imageProxyEndpoint;
    // FIXME: this hard-coded config should be removed, see https://github.com/toeverything/blocksuite/issues/3506
    if (
      !this._imageProxyEndpoint &&
      location.protocol === 'https:' &&
      location.hostname.split('.').includes('affine')
    ) {
      this._imageProxyEndpoint =
        'https://workers.toeverything.workers.dev/proxy/image';
    }
    this._markdownParser = new MarkdownParser(
      this,
      page,
      options.fetchFileHandler,
      options.textStyleHandler,
      options.tableParseHandler,
      options.tableTitleColumnHandler
    );
    this._notionHtmlParser = new NotionHtmlParser(
      this,
      page,
      options.fetchFileHandler,
      options.textStyleHandler,
      options.tableParseHandler,
      options.tableTitleColumnHandler
    );
    this._markdownParser.registerParsers();
    this._notionHtmlParser.registerParsers();
  }

  public async exportHtml() {
    const root = this._page.root;
    if (!root) return;

    const blobMap = new Map<string, string>();
    const htmlContent = await this.block2Html(
      [this.getSelectedBlock(root)],
      blobMap
    );

    await FileExporter.exportHtml(
      (root as PageBlockModel).title.toString(),
      root.id,
      htmlContent,
      blobMap,
      this._page.blob
    );
  }

  public async exportMarkdown() {
    const root = this._page.root;
    if (!root) return;

    const blobMap = new Map<string, string>();
    const markdownContent = await this.block2markdown(
      [this.getSelectedBlock(root)],
      blobMap
    );

    await FileExporter.exportHtmlAsMarkdown(
      (root as PageBlockModel).title.toString(),
      root.id,
      markdownContent,
      blobMap,
      this._page.blob
    );
  }

  private async _checkReady() {
    const pathname = location.pathname;
    const pageMode = isPageMode(this._page);

    const promise = new Promise((resolve, reject) => {
      let count = 0;
      const checkReactRender = setInterval(async () => {
        try {
          this._checkCanContinueToCanvas(pathname, pageMode);
        } catch (e) {
          clearInterval(checkReactRender);
          reject(e);
        }
        const root = this._page.root;
        const pageBlock = root ? getBlockElementByModel(root) : null;
        const imageLoadingComponent = document.querySelector(
          'affine-image-block-loading-card'
        );
        if (pageBlock && !imageLoadingComponent) {
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
    const svgImg = `<svg width="${ctx.canvas.width}px" height="${ctx.canvas.height}px" xmlns="http://www.w3.org/2000/svg" style="background-size:${size}px ${size}px;background-color:${backgroundColor}; background-image: radial-gradient(${gridColor} 1px, ${backgroundColor} 1px)"></svg>`;
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
      useCORS: this._imageProxyEndpoint ? false : true,
      proxy: this._imageProxyEndpoint,
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
    edgeless?: EdgelessPageBlockComponent,
    nodes?: TopLevelBlockModel[],
    surfaces?: SurfaceElement[],
    blockQuery: (id: BaseBlockModel) => Element | null = getBlockElementByModel,
    edgelessBackground?: { zoom: number }
  ): Promise<HTMLCanvasElement | undefined> {
    const root = this._page.root;
    if (!root) return;

    const pathname = location.pathname;
    const pageMode = isPageMode(this._page);
    const editorContainer = getEditorContainer(this._page);
    const containerComputedStyle = window.getComputedStyle(editorContainer);

    const html2canvas = (element: HTMLElement) =>
      this._html2canvas(element, {
        backgroundColor: containerComputedStyle.backgroundColor,
      });
    const container = document.querySelector(
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
    const blocks = nodes ?? edgeless?.getSortedElementsByBound(bound) ?? [];
    for (const block of blocks) {
      const blockElement = blockQuery(block)?.parentElement;

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

      if (block.flavour === EdgelessBlockType.FRAME) {
        const blocksInsideFrame = getBlocksInFrame(this._page, block, false);
        const frameBound = Bound.deserialize(block.xywh);

        for (let i = 0; i < blocksInsideFrame.length; i++) {
          const element = blocksInsideFrame[i];
          const htmlElement = blockQuery(element)?.parentElement;
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
    const pageMode = isPageMode(this._page);

    const editorContainer = getEditorContainer(this._page);
    const pageContainer = editorContainer.querySelector(
      '.affine-doc-page-block-container'
    );
    if (!pageContainer) return;

    const replaceRichTextWithSvgElementFunc =
      this._replaceRichTextWithSvgElement.bind(this);
    const html2canvasOption = {
      ignoreElements: function (element: Element) {
        if (
          element.tagName === 'AFFINE-BLOCK-HUB' ||
          element.tagName === 'EDGELESS-TOOLBAR' ||
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
        await replaceRichTextWithSvgElementFunc(element);
      },
      backgroundColor: window.getComputedStyle(editorContainer).backgroundColor,
      useCORS: this._imageProxyEndpoint ? false : true,
      proxy: this._imageProxyEndpoint,
    };

    const data = await html2canvas(
      pageContainer as HTMLElement,
      html2canvasOption
    );
    this._checkCanContinueToCanvas(pathname, pageMode);
    return data;
  }

  private _replaceRichTextWithSvgElement = async (element: HTMLElement) => {
    const richList = Array.from(element.querySelectorAll('.affine-rich-text'));
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
    if (location.pathname !== pathName || isPageMode(this._page) !== pageMode) {
      throw new Error('Unable to export content to canvas');
    }
  }

  private async _toCanvas(): Promise<HTMLCanvasElement | void> {
    await this._checkReady();

    if (isPageMode(this._page)) {
      return await this._docToCanvas();
    } else {
      const root = this._page.root;
      if (!root) return;

      const edgeless = getBlockElementByModel(
        root
      ) as EdgelessPageBlockComponent;
      const bound = edgeless.getElementsBound();
      assertExists(bound);
      return await this.edgelessToCanvas(
        edgeless.surface.viewport,
        bound,
        edgeless
      );
    }
  }

  public async exportPng() {
    const root = this._page.root;
    if (!root) return;
    const canvasImage = await this._toCanvas();
    if (!canvasImage) {
      return;
    }

    FileExporter.exportPng(
      (this._page.root as PageBlockModel).title.toString(),
      canvasImage.toDataURL('image/png')
    );
  }

  public async exportPdf() {
    const root = this._page.root;
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

  public async block2Html(
    blocks: SelectedBlock[],
    blobMap: Map<string, string>
  ): Promise<string> {
    let htmlText = '';
    for (let currentIndex = 0; currentIndex < blocks.length; currentIndex++) {
      htmlText =
        htmlText +
        (await this._getHtmlInfoBySelectionInfo(blocks[currentIndex], blobMap));
    }
    return htmlText;
  }

  public async block2markdown(
    blocks: SelectedBlock[],
    blobMap: Map<string, string>
  ): Promise<string> {
    let markdownText = '';
    for (let currentIndex = 0; currentIndex < blocks.length; currentIndex++) {
      const block = blocks[currentIndex];
      const text = await this._getMarkdownInfoBySelectionInfo(block, blobMap);
      markdownText += (currentIndex !== 0 ? '\r\n\r\n' : '') + text;
    }
    return markdownText;
  }

  public async block2Text(blocks: SelectedBlock[]): Promise<string> {
    return (
      await Promise.all(
        blocks.map(block => this._getTextInfoBySelectionInfo(block))
      )
    ).reduce((text, block) => text + block, '');
  }

  public async htmlText2Block(
    html: string,
    // TODO: for now, we will use notion html as default context
    context: ParseContext = 'NotionHtml'
  ): Promise<SerializedBlock[]> {
    const htmlEl = document.createElement('html');
    htmlEl.innerHTML = html;
    htmlEl.querySelector('head')?.remove();
    this.slots.beforeHtml2Block.emit(htmlEl);
    return this._convertHtml2Blocks(htmlEl, context);
  }

  async file2Blocks(
    clipboardData: DataTransfer,
    maxFileSize: number
  ): Promise<SerializedBlock[]> {
    const files = clipboardData.files;
    if (!files) return [];
    const file = files[0];
    if (!file) return [];

    const storage = this._page.blob;
    if (file.type.includes('image')) {
      // If file's arrayBuffer() is used, original clipboardData.files will release the file pointer.
      const id = await storage.set(
        new File([file], file.name, { type: file.type })
      );
      return [
        {
          flavour: 'affine:image',
          sourceId: id,
          children: [],
        },
      ];
    }

    if (file.size > maxFileSize) {
      toast(
        `You can only upload files less than ${humanFileSize(
          maxFileSize,
          true,
          0
        )}`
      );
      return [];
    }
    try {
      const sourceId = await storage.set(
        new File([file], file.name, { type: file.type })
      );
      const attachmentProps: AttachmentBlockProps & {
        flavour: 'affine:attachment';
        children: [];
      } = {
        flavour: 'affine:attachment',
        name: file.name,
        sourceId,
        size: file.size,
        type: file.type,
        embed: false,
        children: [],
      };
      return [attachmentProps];
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        toast(
          `Failed to upload attachment! ${error.message || error.toString()}`
        );
      }
    }
    return [];
  }

  public async markdown2Block(text: string): Promise<SerializedBlock[]> {
    const md2html = this._markdown2Html(text);
    return this.htmlText2Block(md2html, 'Markdown');
  }

  public async importMarkdown(text: string, insertPositionId: string) {
    const md2html = this._markdown2Html(text);
    const blocks = await this.htmlText2Block(md2html, 'Markdown');

    await this.importBlocks(blocks, insertPositionId);

    this._importMetaDataFromHtml(md2html);
  }

  public async importHtml(text: string, insertPositionId: string) {
    const blocks = await this.htmlText2Block(text, 'NotionHtml');

    await this.importBlocks(blocks, insertPositionId);

    this._importMetaDataFromHtml(text);
  }

  public async importBlocks(
    blocks: SerializedBlock[],
    insertPositionId: string
  ) {
    const insertBlockModel = this._page.getBlockById(insertPositionId);

    assertExists(insertBlockModel);
    const { getServiceOrRegister } = await import('../service/index.js');
    const service = await getServiceOrRegister(insertBlockModel.flavour);

    await service.json2Block(insertBlockModel, blocks);
  }

  public registerParserHtmlText2Block(
    name: string,
    handler: ParseHtml2BlockHandler
  ) {
    this._parsers[name] = handler;
  }

  public withContext(context: ParseContext): ContextedContentParser {
    return {
      get context() {
        return context;
      },
      getParserHtmlText2Block: (name: string): ParseHtml2BlockHandler => {
        return this._parsers[context + name] || null;
      },
    };
  }

  public getParserHtmlText2Block(name: string): ParseHtml2BlockHandler {
    return this._parsers[name] || null;
  }

  public text2blocks(text: string): SerializedBlock[] {
    return text
      .replaceAll('\r\n', '\n')
      .split('\n')
      .map((str: string) => {
        const splitText = str.split(this.urlPattern);
        const urls = str.match(this.urlPattern);
        const result = [];

        for (let i = 0; i < splitText.length; i++) {
          if (splitText[i]) {
            result.push({ insert: splitText[i] });
          }
          if (urls && urls[i]) {
            result.push({ insert: urls[i], attributes: { link: urls[i] } });
          }
        }

        return {
          flavour: 'affine:paragraph',
          type: 'text',
          text: result,
          children: [],
        };
      });
  }

  public getSelectedBlock(model: BaseBlockModel): SelectedBlock {
    if (model.flavour === 'affine:page') {
      return {
        model,
        children: model.children
          .filter(child => child.flavour === 'affine:note')
          .map(child => this.getSelectedBlock(child)),
      };
    }
    return {
      model,
      children: model.children.map(child => this.getSelectedBlock(child)),
    };
  }

  private async _getHtmlInfoBySelectionInfo(
    block: SelectedBlock,
    blobMap: Map<string, string>
  ): Promise<string> {
    const model = block.model;
    const children: string[] = [];
    for (
      let currentIndex = 0;
      currentIndex < block.children.length;
      currentIndex++
    ) {
      const childText = await this._getHtmlInfoBySelectionInfo(
        block.children[currentIndex],
        blobMap
      );
      childText && children.push(childText);
    }
    const { getServiceOrRegister } = await import('../service/index.js');
    const service = await getServiceOrRegister(model.flavour);

    const text = await service.block2html(
      model,
      {
        childText: children.join(''),
        begin: block.startPos,
        end: block.endPos,
      },
      blobMap
    );
    return text;
  }

  private async _getTextInfoBySelectionInfo(
    selectedBlock: SelectedBlock
  ): Promise<string> {
    const model = selectedBlock.model;

    const children: string[] = [];
    for (const child of selectedBlock.children) {
      const childText = await this._getTextInfoBySelectionInfo(child);
      childText && children.push(childText);
    }

    const { getServiceOrRegister } = await import('../service/index.js');
    const service = await getServiceOrRegister(model.flavour);

    return service.block2Text(model, {
      childText: children.join(''),
      begin: selectedBlock.startPos,
      end: selectedBlock.endPos,
    });
  }

  private async _getMarkdownInfoBySelectionInfo(
    selectedBlock: SelectedBlock,
    blobMap: Map<string, string>,
    level: number = 1
  ): Promise<string> {
    let markdownText = '';
    const { getServiceOrRegister } = await import('../service/index.js');
    const model = selectedBlock.model;
    const service = await getServiceOrRegister(model.flavour);
    markdownText = await service.block2markdown(
      model,
      {
        begin: selectedBlock.startPos,
        end: selectedBlock.endPos,
      },
      blobMap
    );
    if (model.flavour === 'affine:list') {
      markdownText = ' '.repeat(4 * (level - 1)) + markdownText;
    }

    let childLevel = model.flavour === 'affine:list' ? level + 1 : 1;
    for (
      let currentIndex = 0;
      currentIndex < selectedBlock.children.length;
      currentIndex++
    ) {
      const curChild = selectedBlock.children[currentIndex];
      if (curChild.model.flavour !== 'affine:list') {
        childLevel = 1;
      }

      const childText = await this._getMarkdownInfoBySelectionInfo(
        curChild,
        blobMap,
        childLevel
      );

      if (childText) {
        markdownText +=
          (curChild.model.flavour !== 'affine:note' ? '\r\n\r\n' : '') +
          childText;
      }
    }
    return markdownText;
  }

  private async _convertHtml2Blocks(
    element: Element,
    context: ParseContext
  ): Promise<SerializedBlock[]> {
    const openBlockPromises = Array.from(element.children).map(
      async childElement => {
        if (childElement.tagName === 'STYLE') {
          return [];
        }
        return (
          (await this.withContext(context).getParserHtmlText2Block(
            'NodeParser'
          )?.(childElement)) || []
        );
      }
    );

    const results: Array<SerializedBlock[]> = [];
    for (const item of openBlockPromises) {
      results.push(await item);
    }

    return results.flat().filter(v => v);
  }

  private _markdown2Html(text: string): string {
    const underline = {
      name: 'underline',
      level: 'inline',
      start(src: string) {
        return src.indexOf('~');
      },
      tokenizer(src: string) {
        const rule = /^~([^~]+)~/;
        const match = rule.exec(src);
        if (match) {
          return {
            type: 'underline',
            raw: match[0], // This is the text that you want your token to consume from the source
            text: match[1].trim(), // You can add additional properties to your tokens to pass along to the renderer
          };
        }
        return;
      },
      renderer(token: marked.Tokens.Generic) {
        return `<u>${token.text}</u>`;
      },
    };
    const inlineCode = {
      name: 'inlineCode',
      level: 'inline',
      start(src: string) {
        return src.indexOf('`');
      },
      tokenizer(src: string) {
        const rule = /^(?:`)(`{2,}?|[^`]+)(?:`)$/g;
        const match = rule.exec(src);
        if (match) {
          return {
            type: 'inlineCode',
            raw: match[0], // This is the text that you want your token to consume from the source
            text: match[1].trim(), // You can add additional properties to your tokens to pass along to the renderer
          };
        }
        return;
      },
      renderer(token: marked.Tokens.Generic) {
        return `<code>${token.text}</code>`;
      },
    };

    const pageMetaTags = {
      name: 'pageMetaTags',
      level: 'block',
      start(src: string) {
        return src.indexOf('Tags: ');
      },
      tokenizer(src: string) {
        const rule = /^Tags: (.*)$/g;
        const match = rule.exec(src);
        if (match) {
          return {
            type: 'pageMetaTags',
            raw: match[0], // This is the text that you want your token to consume from the source
            text: match[1].trim(), // You can add additional properties to your tokens to pass along to the renderer
          };
        }
        return;
      },
      renderer(token: marked.Tokens.Generic) {
        return `<div class="page-meta-data">
          <div class="value">
            <div class="tags">
              ${(token.text as string)
                .split(',')
                .map(tag => {
                  return `<div class="tag">${tag}</div>`;
                })
                .join('')}
            </div>
          </div>
        </div>`;
      },
    };

    const walkTokens = (token: marked.Token) => {
      // fix: https://github.com/toeverything/blocksuite/issues/3304
      if (
        token.type === 'list_item' &&
        token.tokens.length > 0 &&
        token.tokens[0].type === 'list' &&
        token.tokens[0].items.length === 1
      ) {
        const fistItem = token.tokens[0].items[0];
        if (
          fistItem.tokens.length === 0 ||
          (fistItem.tokens.length === 1 && fistItem.tokens[0].type === 'text')
        ) {
          // transform list_item to text
          const newToken =
            fistItem.tokens.length === 1
              ? (fistItem.tokens[0] as marked.Tokens.Text)
              : ({
                  raw: '',
                  text: '',
                  type: 'text',
                  tokens: [],
                } as marked.Tokens.Text);
          const preText = fistItem.raw.substring(
            0,
            fistItem.raw.length - fistItem.text.length
          );
          newToken.raw = preText + newToken.raw;
          newToken.text = preText + newToken.text;
          newToken.tokens = newToken.tokens || [];
          newToken.tokens.unshift({
            type: 'text',
            text: preText,
            raw: preText,
          });
          token.tokens[0] = newToken;
        }
      }
    };
    marked.use({
      extensions: [underline, inlineCode, pageMetaTags],
      walkTokens,
    });
    const md2html = marked.parse(text);
    return md2html;
  }

  private _importMetaDataFromHtml(text: string) {
    const pageMetaData = this._getMetaDataFromhtmlText(text);
    const tags = pageMetaData.tags.map(tag => {
      return {
        id: nanoid('unknown'),
        value: tag.trim(),
        color: getTagColor(),
      };
    });
    this._page.meta.tags.push(...tags.map(tag => tag.id));
    this._page.workspace.meta.setProperties({
      ...this._page.workspace.meta.properties,
      tags: {
        ...this._page.workspace.meta.properties.tags,
        options: tags,
      },
    });

    // Make sure the title is synced with the model
    const pageMetaTitle = this._page.meta.title;
    const pageModelTitle = (this._page.root as PageBlockModel).title.toString();
    if (pageMetaTitle !== pageModelTitle) {
      this._page.workspace.setPageMeta(this._page.id, {
        title: pageModelTitle,
      });
    }
  }

  private _getMetaDataFromhtmlText(html: string) {
    const htmlEl = document.createElement('html');
    htmlEl.innerHTML = html;
    const tags = htmlEl.querySelectorAll('.page-meta-data .tags .tag');
    return {
      tags: Array.from(tags)
        .map(tag => tag.textContent ?? '')
        .filter(tag => tag !== ''),
    };
  }
}
