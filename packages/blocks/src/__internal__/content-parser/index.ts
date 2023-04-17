import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { Slot } from '@blocksuite/store';
import { marked } from 'marked';

import type { PageBlockModel } from '../../models.js';
import { getFileFromClipboard } from '../clipboard/utils.js';
import { getServiceOrRegister } from '../service.js';
import type { SerializedBlock } from '../utils/index.js';
import { FileExporter } from './file-exporter/file-exporter.js';
import { HtmlParser } from './parse-html.js';
import type { SelectedBlock } from './types.js';

type ParseHtml2BlockFunc = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => Promise<SerializedBlock[] | null>;

export class ContentParser {
  private _page: Page;
  readonly slots = {
    beforeHtml2Block: new Slot<Element>(),
  };
  private _parsers: Record<string, ParseHtml2BlockFunc> = {};
  private _htmlParser: HtmlParser;

  constructor(page: Page) {
    this._page = page;
    this._htmlParser = new HtmlParser(this, page);
    this._htmlParser.registerParsers();
  }

  public async onExportHtml() {
    const root = this._page.root;
    if (!root) return;
    const htmlContent = await this.block2Html(
      this._getSelectedBlock(root).children[0].children
    );
    FileExporter.exportHtml(
      (root as PageBlockModel).title.toString(),
      htmlContent
    );
  }

  public async onExportMarkdown() {
    const root = this._page.root;
    if (!root) return;
    const htmlContent = await this.block2Html(
      this._getSelectedBlock(root).children[0].children
    );
    FileExporter.exportHtmlAsMarkdown(
      (root as PageBlockModel).title.toString(),
      htmlContent
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
  async file2Blocks(clipboardData: DataTransfer) {
    const file = getFileFromClipboard(clipboardData);
    if (file) {
      if (file.type.includes('image')) {
        // TODO: upload file to file server
        // XXX: should use blob storage here?
        const storage = await this._page.blobs;
        assertExists(storage);
        const id = await storage.set(file);
        return [
          {
            flavour: 'affine:embed',
            type: 'image',
            sourceId: id,
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
    const service = await getServiceOrRegister(insertBlockModel.flavour);

    service.json2Block(insertBlockModel, blocks);
  }
  public registerParserHtmlText2Block(name: string, func: ParseHtml2BlockFunc) {
    this._parsers[name] = func;
  }

  public getParserHtmlText2Block(name: string): ParseHtml2BlockFunc {
    return this._parsers[name] || null;
  }

  public text2blocks(text: string): SerializedBlock[] {
    return text.split('\n').map((str: string) => {
      return {
        flavour: 'affine:paragraph',
        type: 'text',
        text: [{ insert: str }],
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
        const clipBlockInfos =
          (await this.getParserHtmlText2Block('nodeParser')?.(childElement)) ||
          [];
        return clipBlockInfos;
      }
    );

    const results: Array<SerializedBlock[]> = [];
    for (const item of openBlockPromises) {
      results.push(await item);
    }

    return results.flat().filter(v => v);
  }
}
