import { PREVENT_DEFAULT } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel, DeltaOperation } from '@blocksuite/store';

import type { KeyboardBindings } from '../rich-text/keyboard.js';
import {
  handleIndent,
  handleKeyDown,
  handleKeyUp,
  handleUnindent,
} from '../rich-text/rich-text-operations.js';
import type { AffineVEditor } from '../rich-text/virgo/types.js';
import { getService } from '../service.js';
import type {
  BlockRange,
  BlockTransformContext,
  OpenBlockInfo,
} from '../utils/index.js';
import { supportsChildren } from '../utils/std.js';
import { json2block } from './json2block.js';
import {
  enterMarkdownMatch,
  hardEnter,
  onBackspace,
  onKeyLeft,
  onKeyRight,
  onSoftEnter,
  onSpace,
  spaceMarkdownMatch,
} from './keymap.js';

export class BaseService<BlockModel extends BaseBlockModel = BaseBlockModel> {
  onLoad?: () => Promise<void>;

  block2html(
    block: BlockModel,
    { childText = '', begin, end }: BlockTransformContext = {}
  ): string {
    const delta = block.text?.sliceToDelta(begin || 0, end) || [];
    const text = delta.reduce((html: string, item: DeltaOperation) => {
      return html + BaseService.deltaLeaf2Html(item);
    }, '');
    return `${text}${childText}`;
  }

  block2Text(
    block: BlockModel,
    { childText = '', begin, end }: BlockTransformContext = {}
  ): string {
    const text = (block.text?.toString() || '').slice(begin || 0, end);
    return `${text}${childText}`;
  }

  block2Json(block: BlockModel, begin?: number, end?: number): OpenBlockInfo {
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
  async json2Block(
    focusedBlockModel: BlockModel,
    pastedBlocks: OpenBlockInfo[],
    range?: BlockRange
  ) {
    return json2block(focusedBlockModel, pastedBlocks, range);
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
      text = `<a href="${attributes.link}">${text}</a>`;
    }
    return text;
  }

  /**
   * side effect when update block
   */
  async updateEffect(block: BlockModel) {
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

  defineKeymap(block: BlockModel, virgo: AffineVEditor): KeyboardBindings {
    return {
      enterMarkdownMatch: {
        key: 'Enter',
        handler: (range, context) => {
          assertExists(virgo);
          return enterMarkdownMatch(block, virgo, range, context);
        },
      },
      spaceMarkdownMatch: {
        key: ' ',
        handler(range, context) {
          assertExists(virgo);
          return spaceMarkdownMatch(block, virgo, range, context);
        },
      },
      hardEnter: {
        key: 'Enter',
        handler(range, context) {
          assertExists(virgo);
          return hardEnter(block, range, virgo, context.event);
        },
      },
      softEnter: {
        key: 'Enter',
        shiftKey: true,
        handler(range, context) {
          assertExists(virgo);
          return onSoftEnter(block, range, virgo);
        },
      },
      // shortKey+enter
      insertLineAfter: {
        key: 'Enter',
        shortKey: true,
        handler(range, context) {
          assertExists(virgo);
          return hardEnter(block, range, virgo, context.event, true);
        },
      },
      tab: {
        key: 'Tab',
        handler(range, context) {
          const index = range.index;
          handleIndent(block.page, block, index);
          context.event.stopPropagation();
          return PREVENT_DEFAULT;
        },
      },
      shiftTab: {
        key: 'Tab',
        shiftKey: true,
        handler(range, context) {
          const index = range.index;
          handleUnindent(block.page, block, index);
          context.event.stopPropagation();
          return PREVENT_DEFAULT;
        },
      },
      backspace: {
        key: 'Backspace',
        handler(range, context) {
          return onBackspace(block, context.event, this.vEditor);
        },
      },
      up: {
        key: 'ArrowUp',
        shiftKey: false,
        handler(range, context) {
          return handleKeyUp(context.event, this.vEditor.rootElement);
        },
      },
      down: {
        key: 'ArrowDown',
        shiftKey: false,
        handler(range, context) {
          return handleKeyDown(context.event, this.vEditor.rootElement);
        },
      },
      left: {
        key: 'ArrowLeft',
        shiftKey: false,
        handler(range, context) {
          return onKeyLeft(context.event, range);
        },
      },
      right: {
        key: 'ArrowRight',
        shiftKey: false,
        handler(range, context) {
          return onKeyRight(block, context.event, range);
        },
      },
      inputRule: {
        key: ' ',
        shiftKey: null,
        prefix: /^(\d+\.|-|\*|\[ ?\]|\[x\]|(#){1,6}|(-){3}|(\*){3}|>)$/,
        handler(range, context) {
          return onSpace(block, virgo, range, context);
        },
      },
    };
  }
}
