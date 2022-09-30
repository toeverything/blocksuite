import { PageContainer } from '../components';
import { SelectBlock } from '../managers';

export class Parse {
  private _page: PageContainer;
  constructor(page: PageContainer) {
    this._page = page;
  }

  public block2Html(blocks: SelectBlock[]): string {
    const htmlText = blocks.reduce((htmlText, block) => {
      return htmlText + this._getHtmlInfoOfBlockBySelectInfo(block);
    }, '');
    return htmlText;
  }

  public block2Text(blocks: SelectBlock[]): string {
    const text = blocks.reduce((text, block) => {
      return text + this._getTextInfoOfBlockBySelectInfo(block);
    }, '');
    return text;
  }

  private _getHtmlInfoOfBlockBySelectInfo(
    selectBlockInfo: SelectBlock
  ): string {
    const model = this._page.store.getBlockById(selectBlockInfo.blockId);
    if (!model) {
      return '';
    }

    // TODO Handling different block by extension
    const delta = model?.text?.sliceToDelta(
      selectBlockInfo.startPos || 0,
      selectBlockInfo.endPos
    );
    const text = delta.reduce((html: string, item: Record<string, unknown>) => {
      return html + this.deltaLeaf2Html(item);
    }, '');

    const children: string[] = [];
    selectBlockInfo.children.forEach(child => {
      const childText = this._getHtmlInfoOfBlockBySelectInfo(child);
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

  private _getTextInfoOfBlockBySelectInfo(
    selectBlockInfo: SelectBlock
  ): string {
    const model = this._page.store.getBlockById(selectBlockInfo.blockId);
    if (!model) {
      return '';
    }

    // TODO Handling different block by extension
    let text = model?.text?.toString() || '';
    const end = selectBlockInfo.endPos ? selectBlockInfo.endPos : text.length;
    text = text.slice(selectBlockInfo.startPos || 0, end);

    const children: string[] = [];
    selectBlockInfo.children.forEach(child => {
      const childText = this._getTextInfoOfBlockBySelectInfo(child);
      childText && children.push(childText);
    });

    return `${text}${children.join('')}`;
  }
}
