import type {
  BlockComponent,
  UIEventStateContext,
} from '@blocksuite/block-std';

import {
  insertLinkedNode,
  textFormatConfigs,
} from '@blocksuite/affine-components/rich-text';
import { matchFlavours } from '@blocksuite/affine-shared/utils';
import { IS_MAC } from '@blocksuite/global/env';
import {
  INLINE_ROOT_ATTR,
  type InlineEditor,
  type InlineRootElement,
} from '@blocksuite/inline';

import type { RootBlockComponent } from '../../../../root-block/types.js';

import { createDefaultDoc } from '../../../utils/init.js';
import { buildPath } from '../../../utils/query.js';
import { tryConvertBlock } from '../markdown/block.js';
import {
  handleIndent,
  handleMultiBlockIndent,
  handleMultiBlockOutdent,
  handleRemoveAllIndent,
  handleRemoveAllIndentForMultiBlocks,
  handleUnindent,
} from '../rich-text-operations.js';
import { bracketPairs } from './bracket-pairs.js';
import { hardEnter, onBackspace, onForwardDelete } from './legacy.js';

// FIXME: use selection manager to set selection
export const bindContainerHotkey = (block: BlockComponent) => {
  const selection = block.host.selection;
  const model = block.model;
  const editorHost = block.host;
  const std = editorHost.std;
  const leftBrackets = bracketPairs.map(pair => pair.left);

  const _selectBlock = () => {
    selection.update(selList => {
      return selList.map(sel => {
        if (sel.blockId === block.blockId) {
          return selection.create('block', { blockId: block.blockId });
        }
        return sel;
      });
    });
    return true;
  };

  const _selectText = (start: boolean) => {
    selection.update(selList => {
      return selList.map(sel => {
        if (sel.blockId === block.blockId) {
          return selection.create('text', {
            from: {
              blockId: block.blockId,
              index: start ? 0 : (block.model.text?.length ?? 0),
              length: 0,
            },
            to: null,
          });
        }
        return sel;
      });
    });
    return true;
  };

  const _getInlineEditor = () => {
    const inlineRoot = block.querySelector<InlineRootElement>(
      `[${INLINE_ROOT_ATTR}]`
    );
    if (!inlineRoot) {
      return null;
    }
    return inlineRoot.inlineEditor;
  };

  const _getPrefixText = (inlineEditor: InlineEditor) => {
    const inlineRange = inlineEditor.getInlineRange();
    if (!inlineRange) return '';
    const firstLineEnd = inlineEditor.yTextString.search(/\n/);
    if (firstLineEnd !== -1 && inlineRange.index > firstLineEnd) {
      return '';
    }
    const textPoint = inlineEditor.getTextPoint(inlineRange.index);
    if (!textPoint) return '';
    const [leafStart, offsetStart] = textPoint;
    return leafStart.textContent
      ? leafStart.textContent.slice(0, offsetStart)
      : '';
  };

  const _preventDefault = (ctx: UIEventStateContext) => {
    const state = ctx.get('defaultState');
    state.event.preventDefault();
  };

  const _selectAllText = () => {
    selection.update(selList => {
      return selList.map(sel => {
        if (sel.blockId !== block.blockId) {
          return sel;
        }
        return selection.create('text', {
          from: {
            blockId: block.blockId,
            index: 0,
            length: block.model.text?.length ?? 0,
          },
          to: null,
        });
      });
    });
    return true;
  };

  block.bindHotKey({
    ArrowUp: () => {
      if (!block.selected?.is('text')) return false;

      const inlineEditor = _getInlineEditor();
      if (!inlineEditor) return;
      const inlineRange = inlineEditor.getInlineRange();
      return !inlineEditor.isFirstLine(inlineRange);
    },
    ArrowDown: () => {
      if (!block.selected?.is('text')) return false;

      const inlineEditor = _getInlineEditor();
      if (!inlineEditor) return;
      const inlineRange = inlineEditor.getInlineRange();
      return !inlineEditor.isLastLine(inlineRange);
    },
    Escape: () => {
      if (block.selected?.is('text')) {
        return _selectBlock();
      }
      return;
    },
    Enter: ctx => {
      _preventDefault(ctx);
      if (block.selected?.is('block')) return _selectText(false);
      const target = ctx.get('defaultState').event.target as Node;
      if (!block.host.contains(target)) return;
      if (!block.selected?.is('text')) return;

      const inlineEditor = _getInlineEditor();
      if (!inlineEditor) return;
      const inlineRange = inlineEditor.getInlineRange();
      if (!inlineRange) return;

      if (matchFlavours(block.model, ['affine:list'])) {
        std.command.exec('splitList', {
          blockId: block.blockId,
          inlineIndex: inlineRange.index,
        });
        return true;
      }

      block.doc.captureSync();

      if (
        !tryConvertBlock(
          block,
          inlineEditor,
          _getPrefixText(inlineEditor),
          inlineRange
        )
      ) {
        return true;
      }
      const state = ctx.get('keyboardState');
      hardEnter(editorHost, model, inlineRange, inlineEditor, state.raw);

      return true;
    },
    'Mod-Enter': ctx => {
      if (!block.selected?.is('text')) return;

      const state = ctx.get('keyboardState');
      const inlineEditor = _getInlineEditor();
      if (!inlineEditor) return;
      const inlineRange = inlineEditor.getInlineRange();
      if (!inlineRange) return;

      _preventDefault(ctx);

      if (matchFlavours(block.model, ['affine:list'])) {
        std.command.exec('splitList', {
          blockId: block.blockId,
          inlineIndex: inlineRange.index,
        });
        return true;
      }

      hardEnter(editorHost, model, inlineRange, inlineEditor, state.raw, true);

      return true;
    },
    Space: ctx => handleMarkdown(ctx),
    'Shift-Space': ctx => handleMarkdown(ctx),
    'Mod-a': ctx => {
      _preventDefault(ctx);
      if (!block.selected?.is('text')) return;

      const text = block.selected;
      const inlineRoot = block.querySelector<InlineRootElement>(
        `[${INLINE_ROOT_ATTR}]`
      );
      if (
        text.from.index === 0 &&
        text.from.length === inlineRoot?.inlineEditor.yText.length
      ) {
        return _selectBlock();
      }

      return _selectAllText();
    },
    Tab: ctx => {
      if (!(block.selected?.is('block') || block.selected?.is('text'))) return;

      _preventDefault(ctx);

      {
        const { selectedModels: textModels } = std.command.exec(
          'getSelectedModels',
          {
            types: ['text'],
          }
        );
        if (textModels && textModels.length === 1) {
          const inlineEditor = _getInlineEditor();
          if (!inlineEditor) return;
          const inlineRange = inlineEditor.getInlineRange();
          if (!inlineRange) return;

          if (matchFlavours(model, ['affine:list'])) {
            std.command.exec('indentList', {
              blockId: model.id,
              inlineIndex: inlineRange.index,
            });
            return true;
          }

          handleIndent(block.host, model, inlineRange.index);

          return true;
        }
      }

      const [_, context] = std.command
        .chain()
        .getSelectedModels({
          types: ['text', 'block'],
        })
        .run();
      const models = context.selectedModels;
      if (!models) return;
      handleMultiBlockIndent(block.host, models);
      return true;
    },
    'Mod-Backspace': ctx => {
      if (!(block.selected?.is('block') || block.selected?.is('text'))) return;

      const rootComponent = block.closest<RootBlockComponent>(
        'affine-page-root,affine-edgeless-root'
      );
      if (!rootComponent) return;

      {
        const [_, context] = std.command
          .chain()
          .getSelectedModels({
            types: ['text'],
          })
          .run();
        const textModels = context.selectedModels;
        if (textModels && textModels.length === 1) {
          const inlineEditor = _getInlineEditor();
          if (!inlineEditor) return;
          const inlineRange = inlineEditor.getInlineRange();
          if (!inlineRange) return;
          if (inlineRange.index === 0) {
            handleRemoveAllIndent(block.host, model, inlineRange.index);
            _preventDefault(ctx);
          }

          return true;
        }
      }

      const [_, context] = std.command
        .chain()
        .getSelectedModels({
          types: ['text', 'block'],
        })
        .run();
      const models = context.selectedModels;
      if (!models) return;
      handleRemoveAllIndentForMultiBlocks(block.host, models);
      return true;
    },
    'Shift-Tab': ctx => {
      if (!(block.selected?.is('block') || block.selected?.is('text'))) return;

      const rootComponent = block.closest<RootBlockComponent>(
        'affine-page-root,affine-edgeless-root'
      );
      if (!rootComponent) return;

      _preventDefault(ctx);

      {
        const { selectedModels: textModels } = std.command.exec(
          'getSelectedModels',
          {
            types: ['text'],
          }
        );

        if (textModels && textModels.length === 1) {
          const inlineEditor = _getInlineEditor();
          if (!inlineEditor) return;
          const inlineRange = inlineEditor.getInlineRange();
          if (!inlineRange) return;

          if (matchFlavours(model, ['affine:list'])) {
            std.command.exec('unindentList', {
              blockId: model.id,
              inlineIndex: inlineRange.index,
            });
            return true;
          }

          handleUnindent(block.host, model, inlineRange.index);

          return true;
        }
      }

      const [_, context] = std.command
        .chain()
        .getSelectedModels({
          types: ['text', 'block'],
        })
        .run();
      const models = context.selectedModels;
      if (!models) return;
      handleMultiBlockOutdent(block.host, models);
      return true;
    },
    Backspace: ctx => {
      if (!block.selected?.is('text')) return;
      const state = ctx.get('keyboardState');
      const inlineEditor = _getInlineEditor();
      if (!inlineEditor) return;
      if (!onBackspace(editorHost, model, state.raw, inlineEditor)) {
        _preventDefault(ctx);
      }

      // Auto delete bracket right
      if (matchFlavours(block.model, ['affine:code'])) {
        const inlineRange = inlineEditor.getInlineRange();
        if (!inlineRange) return;
        const left = inlineEditor.yText.toString()[inlineRange.index - 1];
        const right = inlineEditor.yText.toString()[inlineRange.index];
        if (bracketPairs[leftBrackets.indexOf(left)]?.right === right) {
          const index = inlineRange.index - 1;
          inlineEditor.deleteText({
            index: index,
            length: 2,
          });
          inlineEditor.setInlineRange({
            index: index,
            length: 0,
          });
          _preventDefault(ctx);
        }
      }
      return true;
    },
    Delete: ctx => handleDelete(ctx),
    'Control-d': ctx => {
      if (IS_MAC) handleDelete(ctx);
    },
  });

  textFormatConfigs.forEach(config => {
    if (!config.hotkey) return;

    block.bindHotKey({
      [config.hotkey]: ctx => {
        if (block.doc.readonly) return;

        const textSelection = block.selection.find('text');
        if (!textSelection) return;

        _preventDefault(ctx);

        config.action(editorHost);
        return true;
      },
    });
  });

  function handleMarkdown(ctx: UIEventStateContext) {
    if (!block.selected?.is('text')) return;

    const inlineEditor = _getInlineEditor();
    if (!inlineEditor) return;
    const inlineRange = inlineEditor.getInlineRange();
    if (!inlineRange) return;

    const prefixText = _getPrefixText(inlineEditor);

    if (!tryConvertBlock(block, inlineEditor, prefixText, inlineRange)) {
      _preventDefault(ctx);
      return true;
    }
    return;
  }

  function handleDelete(ctx: UIEventStateContext) {
    if (!block.selected?.is('text')) return;
    const state = ctx.get('keyboardState');
    const inlineEditor = _getInlineEditor();
    if (!inlineEditor) return;
    if (!onForwardDelete(editorHost, model, state.raw, inlineEditor)) {
      _preventDefault(ctx);
    }
    return true;
  }

  function tryConvertToLinkedDoc() {
    const root = model.doc.root;
    if (!root) return false;
    const docBlock = block.host.view.viewFromPath(
      'block',
      buildPath(model.doc.root)
    );
    if (!docBlock) return false;
    const linkedDocWidgetEle = block.host.view.getWidget(
      'affine-linked-doc-widget',
      root.id
    );
    if (!linkedDocWidgetEle) return false;

    const inlineEditor = _getInlineEditor();
    if (!inlineEditor) return;
    const inlineRange = inlineEditor.getInlineRange();
    if (!inlineRange) return false;
    const text = inlineEditor.yText.toString();
    const left = text[inlineRange.index - 1];
    const right = text[inlineRange.index + inlineRange.length];
    const needConvert = left === '[' && right === ']';
    if (!needConvert) return false;

    const docName = text.slice(
      inlineRange.index,
      inlineRange.index + inlineRange.length
    );
    inlineEditor.deleteText({
      index: inlineRange.index - 1,
      length: inlineRange.length + 2,
    });
    inlineEditor.setInlineRange({ index: inlineRange.index - 1, length: 0 });

    const doc = createDefaultDoc(block.doc.collection, {
      title: docName,
    });
    insertLinkedNode({
      inlineEditor,
      docId: doc.id,
    });
    return true;
  }

  // Bracket auto complete
  bracketPairs.forEach(pair => {
    block.bindHotKey({
      [pair.left]: ctx => {
        if (block.doc.readonly) return;

        const textSelection = block.selection.find('text');
        if (!textSelection) return;
        // When selection is collapsed, only trigger auto complete in code block
        if (
          textSelection.isCollapsed() &&
          !matchFlavours(block.model, ['affine:code'])
        )
          return;
        if (!textSelection.isInSameBlock()) return;

        _preventDefault(ctx);

        const inlineEditor = _getInlineEditor();
        if (!inlineEditor) return;
        const inlineRange = inlineEditor.getInlineRange();
        if (!inlineRange) return;
        const selectedText = inlineEditor.yText
          .toString()
          .slice(inlineRange.index, inlineRange.index + inlineRange.length);
        if (pair.name === 'square bracket') {
          // [[Selected text]] should automatically be converted to a Linked doc with the title "Selected text".
          // See https://github.com/toeverything/blocksuite/issues/2730
          const success = tryConvertToLinkedDoc();
          if (success) return true;
        }
        inlineEditor.insertText(
          inlineRange,
          pair.left + selectedText + pair.right
        );

        inlineEditor.setInlineRange({
          index: inlineRange.index + 1,
          length: inlineRange.length,
        });

        return true;
      },
    });
  });

  // Skip redundant right bracket
  bracketPairs.forEach(pair => {
    block.bindHotKey({
      [pair.right]: ctx => {
        if (!matchFlavours(block.model, ['affine:code'])) return;
        const inlineEditor = _getInlineEditor();
        if (!inlineEditor) return;
        const inlineRange = inlineEditor.getInlineRange();
        if (!inlineRange) return;
        const left = inlineEditor.yText.toString()[inlineRange.index - 1];
        const right = inlineEditor.yText.toString()[inlineRange.index];
        if (pair.left === left && pair.right === right) {
          inlineEditor.setInlineRange({
            index: inlineRange.index + 1,
            length: 0,
          });
          _preventDefault(ctx);
        }
      },
    });
  });

  // Convert the selected text into inline code
  block.bindHotKey({
    '`': ctx => {
      if (block.doc.readonly) return;

      const textSelection = block.selection.find('text');
      if (!textSelection || textSelection.isCollapsed()) return;
      if (!textSelection.isInSameBlock()) return;

      _preventDefault(ctx);
      const inlineEditor = _getInlineEditor();
      if (!inlineEditor) return;
      const inlineRange = inlineEditor.getInlineRange();
      if (!inlineRange) return;
      inlineEditor.formatText(inlineRange, { code: true });

      inlineEditor.setInlineRange({
        index: inlineRange.index,
        length: inlineRange.length,
      });

      return true;
    },
  });
};
