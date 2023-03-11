import type { BaseService, PageBlockModel } from '@blocksuite/blocks';
import type { OpenBlockInfo } from '@blocksuite/blocks';
import { getServiceOrRegister } from '@blocksuite/blocks';
import type { BaseBlockModel } from '@blocksuite/store';
import { Slot } from '@blocksuite/store';
import { marked } from 'marked';

import type { EditorContainer, SelectedBlock } from '../../../index.js';
import { FileExporter } from '../../file-exporter/file-exporter.js';
import { HtmlParser } from './parse-html.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParseHtml2BlockFunc = (...args: any[]) => Promise<OpenBlockInfo[] | null>;

export class ContentParser {
  private _editor: EditorContainer;
  readonly slots = {
    beforeHtml2Block: new Slot<Element>(),
  };
  private _parsers: Record<string, ParseHtml2BlockFunc> = {};
  private _htmlParser: HtmlParser;

  constructor(editor: EditorContainer) {
    this._editor = editor;
    this._htmlParser = new HtmlParser(this, this._editor);
    this._htmlParser.registerParsers();
  }

  public async onExportHtml() {
    const root = this._editor.page.root;
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
    const root = this._editor.page.root;
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
        (await this._getHtmlInfoBySelectionInfo(
          blocks[currentIndex],
          currentIndex > 0 ? blocks[currentIndex - 1] : null,
          currentIndex < blocks.length - 1 ? blocks[currentIndex + 1] : null
        ));
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

  public async htmlText2Block(html: string): Promise<OpenBlockInfo[]> {
    const htmlEl = document.createElement('html');
    htmlEl.innerHTML = html;
    htmlEl.querySelector('head')?.remove();
    this.slots.beforeHtml2Block.emit(htmlEl);
    return this._convertHtml2Blocks(htmlEl);
  }

  public async markdown2Block(text: string): Promise<OpenBlockInfo[]> {
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

  public registerParserHtmlText2Block(name: string, func: ParseHtml2BlockFunc) {
    this._parsers[name] = func;
  }

  public getParserHtmlText2Block(name: string): ParseHtml2BlockFunc {
    return this._parsers[name] || null;
  }

  public text2blocks(text: string): OpenBlockInfo[] {
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
    const block = {
      id: model.id,
      children: model.children.map(child => this._getSelectedBlock(child)),
    };
    return block;
  }

  private async _getHtmlInfoBySelectionInfo(
    block: SelectedBlock,
    previousSibling: SelectedBlock | null,
    nextSibling: SelectedBlock | null
  ): Promise<string> {
    const model = this._editor.page.getBlockById(block.id);
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
        block.children[currentIndex],
        currentIndex > 0 ? block.children[currentIndex - 1] : null,
        currentIndex < block.children.length - 1
          ? block.children[currentIndex + 1]
          : null
      );
      childText && children.push(childText);
    }

    const service = (await getServiceOrRegister(model.flavour)) as BaseService;

    return service.block2html(
      model,
      children.join(''),
      previousSibling?.id || '',
      nextSibling?.id || '',
      block.startPos,
      block.endPos
    );
  }

  private async _getTextInfoBySelectionInfo(
    selectedBlock: SelectedBlock
  ): Promise<string> {
    const model = this._editor.page.getBlockById(selectedBlock.id);
    if (!model) {
      return '';
    }

    const children: string[] = [];
    for (const child of selectedBlock.children) {
      const childText = await this._getTextInfoBySelectionInfo(child);
      childText && children.push(childText);
    }

    const service = await getServiceOrRegister(model.flavour);

    return service.block2Text(
      model,
      children.join(''),
      selectedBlock.startPos,
      selectedBlock.endPos
    );
  }

  private async _convertHtml2Blocks(
    element: Element
  ): Promise<OpenBlockInfo[]> {
    const openBlockPromises = Array.from(element.children).map(
      async childElement => {
        const clipBlockInfos =
          (await this.getParserHtmlText2Block('nodeParser')?.(childElement)) ||
          [];
        if (clipBlockInfos.length) {
          return clipBlockInfos;
        }
        return [];
      }
    );

    const results: Array<OpenBlockInfo[]> = [];
    for (const item of openBlockPromises) {
      results.push(await item);
    }

    return results.flat().filter(v => v);
  }
}
