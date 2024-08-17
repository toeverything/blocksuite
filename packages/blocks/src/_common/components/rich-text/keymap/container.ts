import type { BlockStdScope } from '@blocksuite/block-std';
import type {
  BlockComponent,
  UIEventHandler,
  UIEventStateContext,
} from '@blocksuite/block-std';

import {
  focusTextModel,
  getInlineEditorByModel,
  insertLinkedNode,
  selectTextModel,
  textFormatConfigs,
} from '@blocksuite/affine-components/rich-text';
import { BRACKET_PAIRS } from '@blocksuite/affine-shared/consts';
import { matchFlavours } from '@blocksuite/affine-shared/utils';
import { INLINE_ROOT_ATTR, type InlineRootElement } from '@blocksuite/inline';

import { createDefaultDoc } from '../../../utils/init.js';

function selectBlock(std: BlockStdScope, blockId: string) {
  std.selection.setGroup('note', [std.selection.create('block', { blockId })]);
}

export const textModelCommonHotkey = (
  std: BlockStdScope
): Record<string, UIEventHandler> => {
  return {
    ArrowUp: () => {
      const text = std.selection.find('text');
      if (!text) return;
      const inline = getInlineEditorByModel(std.host, text.from.blockId);
      if (!inline) return;
      return !inline.isFirstLine(inline.getInlineRange());
    },
    ArrowDown: () => {
      const text = std.selection.find('text');
      if (!text) return;
      const inline = getInlineEditorByModel(std.host, text.from.blockId);
      if (!inline) return;
      return !inline.isLastLine(inline.getInlineRange());
    },
    Escape: ctx => {
      const text = std.selection.find('text');
      if (!text) return;

      selectBlock(std, text.from.blockId);
      ctx.get('keyboardState').raw.stopPropagation();
      return true;
    },
    'Mod-a': ctx => {
      const text = std.selection.find('text');
      if (!text) return;

      const model = std.doc.getBlock(text.from.blockId)?.model;
      if (!model || !model.text) return;

      ctx.get('keyboardState').raw.preventDefault();

      if (
        text.from.index === 0 &&
        text.from.length === model.text.yText.length
      ) {
        selectBlock(std, text.from.blockId);
        return true;
      }

      selectTextModel(std, text.from.blockId, 0, model.text.yText.length);
      return true;
    },
    Enter: ctx => {
      const blocks = std.selection.filter('block');
      if (blocks.length > 1 || blocks.length === 0) return;

      const blockId = blocks[0].blockId;
      const model = std.doc.getBlock(blockId)?.model;
      if (!model || !model.text) return;

      ctx.get('keyboardState').raw.preventDefault();
      focusTextModel(std, blockId, model.text.yText.length);
      return true;
    },
  };
};

// FIXME: use selection manager to set selection
export const bindContainerHotkey = (block: BlockComponent) => {
  const model = block.model;
  const editorHost = block.host;

  const _getInlineEditor = () => {
    const inlineRoot = block.querySelector<InlineRootElement>(
      `[${INLINE_ROOT_ATTR}]`
    );
    if (!inlineRoot) {
      return null;
    }
    return inlineRoot.inlineEditor;
  };

  const _preventDefault = (ctx: UIEventStateContext) => {
    const state = ctx.get('defaultState');
    state.event.preventDefault();
  };

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

  function tryConvertToLinkedDoc() {
    const root = model.doc.root;
    if (!root) return false;
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
  BRACKET_PAIRS.forEach(pair => {
    block.bindHotKey({
      [pair.left]: ctx => {
        if (block.doc.readonly) return;

        const textSelection = block.selection.find('text');
        if (!textSelection) return;
        const isCodeBlock = matchFlavours(block.model, ['affine:code']);
        // When selection is collapsed, only trigger auto complete in code block
        if (textSelection.isCollapsed() && !isCodeBlock) return;
        if (!textSelection.isInSameBlock()) return;

        _preventDefault(ctx);

        const inlineEditor = _getInlineEditor();
        if (!inlineEditor) return;
        const inlineRange = inlineEditor.getInlineRange();
        if (!inlineRange) return;
        const selectedText = inlineEditor.yText
          .toString()
          .slice(inlineRange.index, inlineRange.index + inlineRange.length);
        if (!isCodeBlock && pair.name === 'square bracket') {
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
  BRACKET_PAIRS.forEach(pair => {
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
