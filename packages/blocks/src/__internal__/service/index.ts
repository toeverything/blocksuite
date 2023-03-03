import type { BaseBlockModel, DeltaOperation } from '@blocksuite/store';

import type { IService } from '../utils/index.js';
import { supportsChildren } from '../utils/std.js';

export class BaseService implements IService {
  onLoad?: () => Promise<void>;
  block2html(
    block: BaseBlockModel,
    childText: string,
    _previousSiblingId: string,
    _nextSiblingId: string,
    begin?: number,
    end?: number
  ) {
    const delta = block.text?.sliceToDelta(begin || 0, end) || [];
    const text = delta.reduce((html: string, item: DeltaOperation) => {
      return html + BaseService.deltaLeaf2Html(item);
    }, '');
    return `${text}${childText}`;
  }

  block2Text(
    block: BaseBlockModel,
    childText: string,
    begin?: number,
    end?: number
  ) {
    const text = (block.text?.toString() || '').slice(begin || 0, end);
    return `${text}${childText}`;
  }

  private static deltaLeaf2Html(deltaLeaf: DeltaOperation) {
    let text: string = deltaLeaf.insert;
    const attributes = deltaLeaf.attributes;
    if (!attributes) {
      return text;
    }
    if (attributes.code) {
      text = `<code>${text}</code>`;
    }
    if (attributes.bold) {
      text = `<strong>${text}</strong>`;
    }
    if (attributes.italic) {
      text = `<em>${text}</em>`;
    }
    if (attributes.underline) {
      text = `<u>${text}</u>`;
    }
    if (attributes.strikethrough) {
      text = `<s>${text}</s>`;
    }
    if (attributes.link) {
      text = `<a href='${attributes.link}'>${text}</a>`;
    }
    return text;
  }

  /**
   * side effect when update block
   */
  async updateEffect(block: BaseBlockModel) {
    const handleUnindent = (
      await import('../rich-text/rich-text-operations.js')
    ).handleUnindent;
    // we need to unindent the first child of the block if it not
    // support children
    if (supportsChildren(block)) {
      return;
    }

    if (!block.children.length) {
      return;
    }

    handleUnindent(block.page, block.children[0], 0, false);
  }
}
