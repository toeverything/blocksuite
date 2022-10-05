import { OpenBlockInfo, EditorContainer, SelectedBlock } from '../../..';

export class ContentParser {
  private _editor: EditorContainer;
  constructor(editor: EditorContainer) {
    this._editor = editor;
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

  public htmlText2Block(html: string) {
    const htmlEl = document.createElement('html');
    htmlEl.innerHTML = html;
    htmlEl.querySelector('head')?.remove();

    return this._convertHtml2Blocks(htmlEl);
  }

  private _getHtmlInfoBySelectionInfo(blocks: SelectedBlock): string {
    const model = this._editor.store.getBlockById(blocks.blockId);
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
    const model = this._editor.store.getBlockById(selectedBlock.blockId);
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
    console.log(element);
    return [];
  }
}
