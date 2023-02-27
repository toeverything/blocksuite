import type { BaseBlockModel } from '@blocksuite/store';
import type { DeltaOperation } from 'quill';

import type { IService } from '../utils/index.js';

export class BaseService implements IService {
  handleUnindent: any;
  supportsChildren: any;
  async onLoad() {
    this.supportsChildren = (
      await import('../utils/index.js')
    ).supportsChildren;
    this.handleUnindent = (
      await import('../rich-text/rich-text-operations.js')
    ).handleUnindent;
  }
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
  updateEffect(block: BaseBlockModel) {
    // we need to unindent the first child of the block if it not
    // support children
    if (this.supportsChildren(block)) {
      return;
    }

    if (!block.children.length) {
      return;
    }

    this.handleUnindent(block.page, block.children[0], 0, false);
  }
}
