import { assertExists } from '@blocksuite/global/utils';
import type { IBound, PhasorElement } from '@blocksuite/phasor';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { Slot } from '@blocksuite/store';
import { marked } from 'marked';

import type { PageBlockModel } from '../../models.js';
import type { EdgelessPageBlockComponent } from '../../page-block/edgeless/edgeless-page-block.js';
import { xywhArrayToObject } from '../../page-block/edgeless/utils/convert.js';
import { getFileFromClipboard } from '../clipboard/utils/pure.js';
import {
  getBlockElementById,
  getEditorContainer,
  getPageBlock,
  isPageMode,
  type SerializedBlock,
  type TopLevelBlockModel,
} from '../utils/index.js';
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
    const htmlContent = await this.block2Html([this.getSelectedBlock(root)]);
    FileExporter.exportHtml(
      (root as PageBlockModel).title.toString(),
      htmlContent
    );
  }

  public async exportMarkdown() {
    const root = this._page.root;
    if (!root) return;
    const htmlContent = await this.block2Html([this.getSelectedBlock(root)]);
    FileExporter.exportHtmlAsMarkdown(
      (root as PageBlockModel).title.toString(),
      htmlContent
    );
  }

  private async _checkReady() {
    const promise = new Promise(resolve => {
      let count = 0;
      const checkReactRender = setInterval(async () => {
        const root = this._page.root;
        const pageBlock = root ? getPageBlock(root) : null;
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

  public async edgelessToCanvas(
    edgeless: EdgelessPageBlockComponent,
    bound: IBound,
    nodes?: TopLevelBlockModel[],
    surfaces?: PhasorElement[]
  ): Promise<HTMLCanvasElement | undefined> {
    const root = this._page.root;
    if (!root) return;

    const html2canvas = (await import('html2canvas')).default;
    if (!(html2canvas instanceof Function)) return;

    const editorContainer = getEditorContainer(this._page);
    const container = document.querySelector(
      '.affine-block-children-container'
    );
    if (!container) return;

    const dpr = window.devicePixelRatio || 1;
    const canvas = document.createElement('canvas');
    canvas.width = (bound.w + 100) * dpr;
    canvas.height = (bound.h + 100) * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = window.getComputedStyle(container).backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
      onclone: function (documentClone: Document, element: HTMLElement) {
        // html2canvas can't support transform feature
        element.style.setProperty('transform', 'none');
        const layer = documentClone.querySelector('.affine-edgeless-layer');
        if (layer && layer instanceof HTMLElement) {
          layer.style.setProperty('transform', 'none');
        }
      },
      backgroundColor: window.getComputedStyle(editorContainer).backgroundColor,
      useCORS: this._imageProxyEndpoint ? false : true,
      proxy: this._imageProxyEndpoint,
    };

    const nodeElements = nodes ?? edgeless.getSortedElementsByBound(bound);
    for (const nodeElement of nodeElements) {
      const blockElement = getBlockElementById(nodeElement.id)?.parentElement;
      const blockBound = xywhArrayToObject(nodeElement);
      const canvasData = await html2canvas(
        blockElement as HTMLElement,
        html2canvasOption
      );
      ctx.drawImage(
        canvasData,
        blockBound.x - bound.x + 50,
        blockBound.y - bound.y + 50,
        blockBound.w,
        blockBound.h
      );
    }

    const surfaceCanvas = edgeless.surface.viewport.getCanvasByBound(
      bound,
      surfaces
    );
    ctx.drawImage(surfaceCanvas, 50, 50, bound.w, bound.h);

    return canvas;
  }

  private async _docToCanvas(): Promise<HTMLCanvasElement | void> {
    const editorContainer = getEditorContainer(this._page);
    const pageContainer = editorContainer.querySelector(
      '.affine-default-page-block-container'
    );
    if (!pageContainer) return;

    const html2canvas = (await import('html2canvas')).default;
    if (!(html2canvas instanceof Function)) return;

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
      backgroundColor: window.getComputedStyle(editorContainer).backgroundColor,
      useCORS: this._imageProxyEndpoint ? false : true,
      proxy: this._imageProxyEndpoint,
    };

    const data = await html2canvas(
      pageContainer as HTMLElement,
      html2canvasOption
    );
    return data;
  }

  private async _toCanvas(): Promise<HTMLCanvasElement | void> {
    await this._checkReady();

    if (isPageMode(this._page)) {
      return await this._docToCanvas();
    } else {
      const root = this._page.root;
      if (!root) return;

      const edgeless = getPageBlock(root) as EdgelessPageBlockComponent;
      const bound = edgeless.getElementsBound();
      assertExists(bound);
      return await this.edgelessToCanvas(edgeless, bound);
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
      canvasImage.toDataURL('PNG')
    );
  }

  public async exportPdf() {
    const root = this._page.root;
    if (!root) return;
    const canvasImage = await this._toCanvas();
    if (!canvasImage) {
      return;
    }
    const jspdf = await import('jspdf');
    const pdf = new jspdf.jsPDF(
      canvasImage.width < canvasImage.height ? 'p' : 'l',
      'pt',
      [canvasImage.width, canvasImage.height]
    );
    pdf.addImage(
      canvasImage.toDataURL('PNG'),
      'PNG',
      0,
      0,
      canvasImage.width,
      canvasImage.height,
      '',
      'FAST'
    );
    FileExporter.exportFile(
      (root as PageBlockModel).title.toString() + '.pdf',
      pdf.output('dataurlstring')
    );
  }

  public async block2Html(blocks: SelectedBlock[]): Promise<string> {
    let htmlText = '';
    for (let currentIndex = 0; currentIndex < blocks.length; currentIndex++) {
      htmlText =
        htmlText +
        (await this._getHtmlInfoBySelectionInfo(blocks[currentIndex]));
    }
    return htmlText;
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

  async file2Blocks(clipboardData: DataTransfer): Promise<SerializedBlock[]> {
    const file = getFileFromClipboard(clipboardData);
    if (file) {
      if (file.type.includes('image')) {
        // TODO: upload file to file server
        // XXX: should use blob storage here?
        const storage = this._page.blobs;
        assertExists(storage);
        const id = await storage.set(file);
        return [
          {
            flavour: 'affine:image',
            sourceId: id,
            children: [],
          },
        ];
      }
    }
    return [];
  }

  public async markdown2Block(text: string): Promise<SerializedBlock[]> {
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
    marked.use({ extensions: [underline, inlineCode], walkTokens });
    const md2html = marked.parse(text);
    return this.htmlText2Block(md2html, 'Markdown');
  }

  public async importMarkdown(text: string, insertPositionId: string) {
    const blocks = await this.markdown2Block(text);
    const insertBlockModel = this._page.getBlockById(insertPositionId);

    assertExists(insertBlockModel);
    const { getServiceOrRegister } = await import('../service.js');
    const service = await getServiceOrRegister(insertBlockModel.flavour);

    service.json2Block(insertBlockModel, blocks);
  }

  public async importHtml(text: string, insertPositionId: string) {
    const blocks = await this.htmlText2Block(text, 'NotionHtml');
    const insertBlockModel = this._page.getBlockById(insertPositionId);

    assertExists(insertBlockModel);
    const { getServiceOrRegister } = await import('../service.js');
    const service = await getServiceOrRegister(insertBlockModel.flavour);

    service.json2Block(insertBlockModel, blocks);
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
        id: model.id,
        children: model.children
          .filter(child => child.flavour === 'affine:note')
          .map(child => this.getSelectedBlock(child)),
      };
    }
    return {
      id: model.id,
      children: model.children.map(child => this.getSelectedBlock(child)),
    };
  }

  private async _getHtmlInfoBySelectionInfo(
    block: SelectedBlock
  ): Promise<string> {
    const model = this._page.getBlockById(block.id);
    if (!model) {
      return '';
    }

    const children: string[] = [];
    for (
      let currentIndex = 0;
      currentIndex < block.children.length;
      currentIndex++
    ) {
      const childText = await this._getHtmlInfoBySelectionInfo(
        block.children[currentIndex]
      );
      childText && children.push(childText);
    }
    const { getServiceOrRegister } = await import('../service.js');
    const service = await getServiceOrRegister(model.flavour);

    return service.block2html(model, {
      childText: children.join(''),
      begin: block.startPos,
      end: block.endPos,
    });
  }

  private async _getTextInfoBySelectionInfo(
    selectedBlock: SelectedBlock
  ): Promise<string> {
    const model = this._page.getBlockById(selectedBlock.id);
    if (!model) {
      return '';
    }

    const children: string[] = [];
    for (const child of selectedBlock.children) {
      const childText = await this._getTextInfoBySelectionInfo(child);
      childText && children.push(childText);
    }

    const { getServiceOrRegister } = await import('../service.js');
    const service = await getServiceOrRegister(model.flavour);

    return service.block2Text(model, {
      childText: children.join(''),
      begin: selectedBlock.startPos,
      end: selectedBlock.endPos,
    });
  }

  private async _convertHtml2Blocks(
    element: Element,
    context: ParseContext
  ): Promise<SerializedBlock[]> {
    const openBlockPromises = Array.from(element.children).map(
      async childElement => {
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
}
