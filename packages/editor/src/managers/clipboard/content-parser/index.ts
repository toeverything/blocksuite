import type { SelectedBlock } from '@blocksuite/shared';
import { Slot } from '@blocksuite/store';
import { OpenBlockInfo, EditorContainer } from '../../..';
import { ParserHtml } from './parse-html';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParseHtml2BlockFunc = (...args: any[]) => OpenBlockInfo[] | null;

export class ContentParser {
  private _editor: EditorContainer;
  readonly slots = {
    beforeHtml2Block: new Slot<Element>(),
  };
  private _parsers: Record<string, ParseHtml2BlockFunc> = {};
  private _parseHtml: ParserHtml;
  constructor(editor: EditorContainer) {
    this._editor = editor;
    this._parseHtml = new ParserHtml(this);
    this._parseHtml.registerParsers();
  }

  public block2Html(blocks: SelectedBlock[]): string {
    const htmlText = blocks.reduce((htmlText, block) => {
      return htmlText + this._getHtmlInfoBySelectionInfo(block);
    }, '');
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
    this.slots.beforeHtml2Block.emit(htmlEl);
    return this._convertHtml2Blocks(htmlEl);
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
        flavour: 'paragraph',
        type: 'text',
        text: [{ insert: str }],
        children: [],
      };
    });
  }

  private _getHtmlInfoBySelectionInfo(blocks: SelectedBlock): string {
    const model = this._editor.store.getBlockById(blocks.id);
    if (!model) {
      return '';
    }

    // TODO Handling different block by extension
    const delta = model?.text?.sliceToDelta(
      blocks.startPos || 0,
      blocks.endPos
    );
    const text = delta.reduce((html: string, item: Record<string, unknown>) => {
      return html + this.deltaLeaf2Html(item);
    }, '');

    const children: string[] = [];
    blocks.children.forEach(child => {
      const childText = this._getHtmlInfoBySelectionInfo(child);
      childText && children.push(childText);
    });

    return `<div>${text}${children.join('')}</div>`;
  }

  // TODO This part of the logic needs refinement
  private deltaLeaf2Html(deltaLeaf: Record<string, unknown>) {
    const text = deltaLeaf.insert;
    const attributes: Record<string, boolean> = deltaLeaf.attributes as Record<
      string,
      boolean
    >;
    if (!attributes) {
      return text;
    }
    if (attributes.bold) {
      return `<strong>${text}</strong>`;
    }
    if (attributes.italic) {
      return `<em>${text}</em>`;
    }
    if (attributes.underline) {
      return `<u>${text}</u>`;
    }
    if (attributes.inlinecode) {
      return `<code>${text}</code>`;
    }
    if (attributes.strikethrough) {
      return `<s>${text}</s>`;
    }
    return text;
  }

  private _getTextInfoBySelectionInfo(selectedBlock: SelectedBlock): string {
    const model = this._editor.store.getBlockById(selectedBlock.id);
    if (!model) {
      return '';
    }

    // TODO Handling different block by extension
    let text = model?.text?.toString() || '';
    const end = selectedBlock.endPos ? selectedBlock.endPos : text.length;
    text = text.slice(selectedBlock.startPos || 0, end);

    const children: string[] = [];
    selectedBlock.children.forEach(child => {
      const childText = this._getTextInfoBySelectionInfo(child);
      childText && children.push(childText);
    });

    return `${text}${children.join('')}`;
  }

  private _convertHtml2Blocks(element: Element): OpenBlockInfo[] {
    return Array.from(element.childNodes)
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
