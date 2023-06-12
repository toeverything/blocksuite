import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { Slot } from '@blocksuite/store';
import { toCanvas } from 'html-to-image';
import jsPDF from 'jspdf';
import { marked } from 'marked';

import type { PageBlockModel } from '../../models.js';
import type { EdgelessPageBlockComponent } from '../../page-block/edgeless/edgeless-page-block.js';
import { getFileFromClipboard } from '../clipboard/utils/pure.js';
import {
  getEditorContainer,
  getPageBlock,
  isPageMode,
  type SerializedBlock,
} from '../utils/index.js';
import { FileExporter } from './file-exporter/file-exporter.js';
import type {
  FetchFileHandler,
  TableParserHandler,
  TextStyleHandler,
} from './parse-html.js';
import { HtmlParser } from './parse-html.js';
import type { SelectedBlock } from './types.js';

type ParseHtml2BlockHandler = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => Promise<SerializedBlock[] | null>;

export class ContentParser {
  private _page: Page;
  readonly slots = {
    beforeHtml2Block: new Slot<Element>(),
  };
  private _parsers: Record<string, ParseHtml2BlockHandler> = {};
  private _htmlParser: HtmlParser;
  private urlPattern =
    /(?<=\s|^)https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)(?=\s|$)/g;
  constructor(
    page: Page,
    fetchFileHandler?: FetchFileHandler,
    textStyleHandler?: TextStyleHandler,
    tableParserHandler?: TableParserHandler
  ) {
    this._page = page;
    this._htmlParser = new HtmlParser(
      this,
      page,
      fetchFileHandler,
      textStyleHandler,
      tableParserHandler
    );
    this._htmlParser.registerParsers();
  }

  public async exportHtml() {
    const root = this._page.root;
    if (!root) return;
    const htmlContent = await this.block2Html(
      this._getSelectedBlock(root).children[1].children
    );
    FileExporter.exportHtml(
      (root as PageBlockModel).title.toString(),
      htmlContent
    );
  }

  public async exportMarkdown() {
    const root = this._page.root;
    if (!root) return;
    const htmlContent = await this.block2Html(
      this._getSelectedBlock(root).children[1].children
    );
    FileExporter.exportHtmlAsMarkdown(
      (root as PageBlockModel).title.toString(),
      htmlContent
    );
  }

  public async transPageToCanvas(): Promise<HTMLCanvasElement | undefined> {
    const root = this._page.root;
    if (!root) return;

    const editorContainer = getEditorContainer(this._page);
    if (isPageMode(this._page)) {
      const styleElement = document.createElement('style');
      styleElement.textContent =
        'editor-container,.affine-editor-container {height: auto;}';
      editorContainer.appendChild(styleElement);

      const data = await toCanvas(editorContainer, {
        cacheBust: true,
      });
      editorContainer.removeChild(styleElement);
      return data;
    } else {
      const styleElement = document.createElement('style');
      const edgeless = getPageBlock(root) as EdgelessPageBlockComponent;
      const bound = edgeless.getElementsBound();
      assertExists(bound);
      const { x, y, w, h } = bound;
      styleElement.textContent = `
        edgeless-toolbar {display: none;}
        editor-container,.affine-editor-container {height: ${
          h + 100
        }px; width: ${w + 100}px}
      `;
      editorContainer.appendChild(styleElement);

      const width = edgeless.surface.viewport.width;
      const height = edgeless.surface.viewport.height;
      edgeless.surface.viewport.setCenter(
        x + width / 2 - 50,
        y + height / 2 - 50
      );

      const promise = new Promise(resolve => {
        setTimeout(async () => {
          const pngData = await toCanvas(editorContainer, {
            cacheBust: true,
          });
          resolve(pngData);
        }, 0);
      });
      const data = (await promise) as HTMLCanvasElement;
      editorContainer.removeChild(styleElement);
      return data;
    }
  }

  public async exportPng() {
    const root = this._page.root;
    if (!root) return;
    const canvasImage = await this.transPageToCanvas();
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
    const canvasImage = await this.transPageToCanvas();
    if (!canvasImage) {
      return;
    }
    const pdf = new jsPDF(
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
      canvasImage.height
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

  public async htmlText2Block(html: string): Promise<SerializedBlock[]> {
    const htmlEl = document.createElement('html');
    htmlEl.innerHTML = html;
    htmlEl.querySelector('head')?.remove();
    this.slots.beforeHtml2Block.emit(htmlEl);
    return this._convertHtml2Blocks(htmlEl);
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
            flavour: 'affine:embed',
            type: 'image',
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderer(token: any) {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderer(token: any) {
        return `<code>${token.text}</code>`;
      },
    };
    marked.use({ extensions: [underline, inlineCode] });
    const md2html = marked.parse(text);
    return this.htmlText2Block(md2html);
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
    const blocks = await this.htmlText2Block(text);
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

  public getParserHtmlText2Block(name: string): ParseHtml2BlockHandler {
    return this._parsers[name] || null;
  }

  public text2blocks(text: string): SerializedBlock[] {
    return text.split('\n').map((str: string) => {
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

  private _getSelectedBlock(model: BaseBlockModel): SelectedBlock {
    return {
      id: model.id,
      children: model.children.map(child => this._getSelectedBlock(child)),
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
    element: Element
  ): Promise<SerializedBlock[]> {
    const openBlockPromises = Array.from(element.children).map(
      async childElement => {
        return (
          (await this.getParserHtmlText2Block('nodeParser')?.(childElement)) ||
          []
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
