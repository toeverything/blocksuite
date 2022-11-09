import { marked } from 'marked';
import type { PageBlockModel } from '@blocksuite/blocks';
import { BaseBlockModel, Signal } from '@blocksuite/store';
import type { OpenBlockInfo, EditorContainer, SelectedBlock } from '../../..';
import { FileExporter } from '../../file-exporter/file-exporter';
import { ParserHtml } from './parse-html';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParseHtml2BlockFunc = (...args: any[]) => OpenBlockInfo[] | null;

export class ContentParser {
  private _editor: EditorContainer;
  readonly signals = {
    beforeHtml2Block: new Signal<Element>(),
  };
  private _parsers: Record<string, ParseHtml2BlockFunc> = {};
  private _parseHtml: ParserHtml;
  constructor(editor: EditorContainer) {
    this._editor = editor;
    this._parseHtml = new ParserHtml(this);
    this._parseHtml.registerParsers();
  }

  public onExportHtml() {
    const root = this._editor.space.root;
    if (!root) return;
    const htmlContent = this.block2Html(this._getSelectedBlock(root).children);
    FileExporter.exportHtml((root as PageBlockModel).title, htmlContent);
  }

  public onExportMarkdown() {
    const root = this._editor.space.root;
    if (!root) return;
    const htmlContent = this.block2Html(this._getSelectedBlock(root).children);
    FileExporter.exportMarkdown((root as PageBlockModel).title, htmlContent);
  }

  public block2Html(blocks: SelectedBlock[]): string {
    const htmlText = blocks.reduce(
      (htmlText, block, currentIndex: number, array: SelectedBlock[]) => {
        return (
          htmlText +
          this._getHtmlInfoBySelectionInfo(
            block,
            currentIndex > 0 ? array[currentIndex - 1] : null,
            currentIndex < array.length - 1 ? array[currentIndex + 1] : null
          )
        );
      },
      ''
    );
    return htmlText;
  }

  public block2Text(blocks: SelectedBlock[]): string {
    const text = blocks.reduce((text, block) => {
      return text + this._getTextInfoBySelectionInfo(block);
    }, '');
    return text;
  }

  public htmlText2Block(html: string): OpenBlockInfo[] {
    const htmlEl = document.createElement('html');
    htmlEl.innerHTML = html;
    htmlEl.querySelector('head')?.remove();
    this.signals.beforeHtml2Block.emit(htmlEl);
    return this._convertHtml2Blocks(htmlEl);
  }

  public markdown2Block(text: string): OpenBlockInfo[] {
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
    marked.use({ extensions: [underline] });
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

  private _getHtmlInfoBySelectionInfo(
    block: SelectedBlock,
    previousSibling: SelectedBlock | null,
    nextSibling: SelectedBlock | null
  ): string {
    const model = this._editor.space.getBlockById(block.id);
    if (!model) {
      return '';
    }

    const children: string[] = block.children.reduce(
      (children, child, currentIndex: number, array: SelectedBlock[]) => {
        const childText = this._getHtmlInfoBySelectionInfo(
          child,
          currentIndex > 0 ? array[currentIndex - 1] : null,
          currentIndex < array.length - 1 ? array[currentIndex + 1] : null
        );
        childText && children.push(childText);
        return children;
      },
      [] as string[]
    );

    const text = model.block2html(
      children.join(''),
      previousSibling?.id || '',
      nextSibling?.id || '',
      block.startPos,
      block.endPos
    );

    return text;
  }

  private _getTextInfoBySelectionInfo(selectedBlock: SelectedBlock): string {
    const model = this._editor.space.getBlockById(selectedBlock.id);
    if (!model) {
      return '';
    }

    const children: string[] = [];
    selectedBlock.children.forEach(child => {
      const childText = this._getTextInfoBySelectionInfo(child);
      childText && children.push(childText);
    });

    const text = model.block2Text(
      children.join(''),
      selectedBlock.startPos,
      selectedBlock.endPos
    );

    return text;
  }

  private _convertHtml2Blocks(element: Element): OpenBlockInfo[] {
    return Array.from(element.children)
      .map(childElement => {
        const clipBlockInfos =
          this.getParserHtmlText2Block('nodeParser')?.(childElement) || [];

        if (clipBlockInfos && clipBlockInfos.length) {
          return clipBlockInfos;
        }
        return [];
      })
      .flat()
      .filter(v => v);
  }
}
