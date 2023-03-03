import type { BaseBlockModel } from '@blocksuite/store';
import type { DeltaOperation } from 'quill';

import { getService } from '../service.js';
import type { IService, OpenBlockInfo } from '../utils/index.js';
import { supportsChildren } from '../utils/std.js';
import { json2block } from './json2block.js';

export class BaseService implements IService {
  onLoad?: () => Promise<void>;
  block2html(
    block: BaseBlockModel,
    {
      childText = '',
      begin,
      end,
    }: {
      childText?: string;
      begin?: number;
      end?: number;
    } = {}
  ): string {
    const delta = block.text?.sliceToDelta(begin || 0, end) || [];
    const text = delta.reduce((html: string, item: DeltaOperation) => {
      return html + BaseService.deltaLeaf2Html(item);
    }, '');
    return `${text}${childText}`;
  }

  block2Text(
    block: BaseBlockModel,
    {
      childText = '',
      begin,
      end,
    }: {
      childText?: string;
      begin?: number;
      end?: number;
    } = {}
  ): string {
    const text = (block.text?.toString() || '').slice(begin || 0, end);
    return `${text}${childText}`;
  }

  block2Json(
    block: BaseBlockModel,
    begin?: number,
    end?: number
  ): OpenBlockInfo {
    const delta = block.text?.sliceToDelta(begin || 0, end) || [];
    return {
      flavour: block.flavour,
      type: block.type as string,
      text: delta,
      children: block.children?.map((child, index) => {
        if (index === block.children.length - 1) {
          // @ts-ignore
          return getService(child.flavour).block2Json(child, 0, end);
        }
        // @ts-ignore
        return getService(child.flavour).block2Json(child);
      }),
    };
  }

  // json2block is triggered when paste behavior occurs(now),
  // at this time cursor is focus on one block, and is must a caret in this block(since selection has been handled in paste callback)
  // this is the common handler for most block, but like code block, it should be overridden this
  json2Block(focusedBlockModel: BaseBlockModel, pastedBlocks: OpenBlockInfo[]) {
    return json2block(focusedBlockModel, pastedBlocks);
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
    // supports children
    if (supportsChildren(block)) {
      return;
    }

    if (!block.children.length) {
      return;
    }

    handleUnindent(block.page, block.children[0], 0, false);
  }
}
