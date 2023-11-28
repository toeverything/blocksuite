import type { UIEventStateContext } from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
import { IS_MAC } from '@blocksuite/global/env';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import {
  type VEditor,
  VIRGO_ROOT_ATTR,
  type VirgoRootElement,
} from '@blocksuite/virgo';

import { matchFlavours } from '../../../../_common/utils/model.js';
import type { PageBlockComponent } from '../../../../page-block/types.js';
import { getSelectedContentModels } from '../../../../page-block/utils/selection.js';
import { textFormatConfigs } from '../../../configs/text-format/config.js';
import { createPage } from '../../../utils/init.js';
import { buildPath } from '../../../utils/query.js';
import { insertLinkedNode } from '../../../widgets/linked-page/config.js';
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

export const bindContainerHotkey = (blockElement: BlockElement) => {
  const selection = blockElement.root.selection;
  const model = blockElement.model;
  const root = blockElement.root;
  const leftBrackets = bracketPairs.map(pair => pair.left);

  const _selectBlock = () => {
    selection.update(selList => {
      return selList.map(sel => {
        if (PathFinder.equals(sel.path, blockElement.path)) {
          return selection.getInstance('block', { path: blockElement.path });
        }
        return sel;
      });
    });
    blockElement
      .querySelector<VirgoRootElement>(`[${VIRGO_ROOT_ATTR}]`)
      ?.blur();
    return true;
  };

  const _selectText = (start: boolean) => {
    selection.update(selList => {
      return selList.map(sel => {
        if (PathFinder.equals(sel.path, blockElement.path)) {
          return selection.getInstance('text', {
            from: {
              path: blockElement.path,
              index: start ? 0 : blockElement.model.text?.length ?? 0,
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

  const _getVirgo = () => {
    const vRoot = blockElement.querySelector<VirgoRootElement>(
      `[${VIRGO_ROOT_ATTR}]`
    );
    if (!vRoot) {
      throw new Error('Virgo root not found');
    }
    return vRoot.virgoEditor;
  };

  const _getPrefixText = (vEditor: VEditor) => {
    const vRange = vEditor.getVRange();
    assertExists(vRange);
    const [leafStart, offsetStart] = vEditor.getTextPoint(vRange.index);
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
        if (!PathFinder.equals(sel.path, blockElement.path)) {
          return sel;
        }
        return selection.getInstance('text', {
          from: {
            path: blockElement.path,
            index: 0,
            length: blockElement.model.text?.length ?? 0,
          },
          to: null,
        });
      });
    });
    return true;
  };

  blockElement.bindHotKey({
    ArrowUp: ctx => {
      _preventDefault(ctx);
    },
    ArrowDown: ctx => {
      _preventDefault(ctx);
    },
    ArrowRight: ctx => {
      if (blockElement.selected?.is('block')) {
        return _selectText(false);
      }

      if (!blockElement.selected?.is('text')) return;
      const vEditor = _getVirgo();
      const vRange = vEditor.getVRange();
      if (!vRange) {
        return;
      }

      if (vRange.length === 0 && vRange.index === vEditor.yText.length) {
        _preventDefault(ctx);
        return;
      }

      return true;
    },
    ArrowLeft: ctx => {
      if (blockElement.selected?.is('block')) {
        return _selectText(true);
      }
      if (!blockElement.selected?.is('text')) return;
      const vEditor = _getVirgo();
      const vRange = vEditor.getVRange();
      if (!vRange) {
        return;
      }

      if (vRange.length === 0 && vRange.index === 0) {
        _preventDefault(ctx);
        return;
      }

      return true;
    },
    'Shift-ArrowUp': ctx => {
      _preventDefault(ctx);
    },
    'Shift-ArrowDown': ctx => {
      _preventDefault(ctx);
    },
    'Shift-ArrowRight': ctx => {
      _preventDefault(ctx);
    },
    'Shift-ArrowLeft': ctx => {
      _preventDefault(ctx);
    },
    Escape: () => {
      if (blockElement.selected?.is('text')) {
        return _selectBlock();
      }
      return;
    },
    Enter: ctx => {
      if (blockElement.selected?.is('block')) {
        return _selectText(false);
      }
      if (!blockElement.selected?.is('text')) {
        return;
      }
      blockElement.model.page.captureSync();

      const vEditor = _getVirgo();
      const vRange = vEditor.getVRange();
      assertExists(vRange);

      if (
        !tryConvertBlock(blockElement, vEditor, _getPrefixText(vEditor), vRange)
      ) {
        _preventDefault(ctx);
        return true;
      }

      const state = ctx.get('keyboardState');
      hardEnter(model, vRange, vEditor, state.raw);
      _preventDefault(ctx);

      return true;
    },
    'Mod-Enter': ctx => {
      if (!blockElement.selected?.is('text')) return;

      const state = ctx.get('keyboardState');
      const vEditor = _getVirgo();
      const vRange = vEditor.getVRange();
      assertExists(vRange);
      hardEnter(model, vRange, vEditor, state.raw, true);
      _preventDefault(ctx);

      return true;
    },
    Space: ctx => {
      if (!blockElement.selected?.is('text')) return;

      const vEditor = _getVirgo();
      const vRange = vEditor.getVRange();
      assertExists(vRange);

      const prefixText = _getPrefixText(vEditor);

      if (!tryConvertBlock(blockElement, vEditor, prefixText, vRange)) {
        _preventDefault(ctx);
      }

      return true;
    },
    'Mod-a': ctx => {
      _preventDefault(ctx);
      if (!blockElement.selected?.is('text')) return;

      const text = blockElement.selected;
      const virgo = blockElement.querySelector<VirgoRootElement>(
        `[${VIRGO_ROOT_ATTR}]`
      );
      if (
        text.from.index === 0 &&
        text.from.length === virgo?.virgoEditor.yText.length
      ) {
        return _selectBlock();
      }

      return _selectAllText();
    },
    Tab: ctx => {
      if (
        !(
          blockElement.selected?.is('block') ||
          blockElement.selected?.is('text')
        )
      )
        return;

      const textModels = getSelectedContentModels(root, ['text']);
      if (textModels.length === 1) {
        const vEditor = _getVirgo();
        const vRange = vEditor.getVRange();
        assertExists(vRange);
        handleIndent(model.page, model, vRange.index);
        _preventDefault(ctx);

        return true;
      }

      const models = getSelectedContentModels(root, ['text', 'block']);
      handleMultiBlockIndent(blockElement.page, models);
      return true;
    },
    'Mod-Backspace': ctx => {
      if (
        !(
          blockElement.selected?.is('block') ||
          blockElement.selected?.is('text')
        )
      )
        return;

      const page = blockElement.closest<PageBlockComponent>(
        'affine-doc-page,affine-edgeless-page'
      );
      if (!page) return;

      const textModels = getSelectedContentModels(root, ['text']);
      if (textModels.length === 1) {
        const vEditor = _getVirgo();
        const vRange = vEditor.getVRange();
        assertExists(vRange);
        if (vRange.index === 0) {
          handleRemoveAllIndent(model.page, model, vRange.index);
          _preventDefault(ctx);
        }

        return true;
      }

      const models = getSelectedContentModels(root, ['text', 'block']);
      handleRemoveAllIndentForMultiBlocks(blockElement.page, models);
      return true;
    },
    'Shift-Tab': ctx => {
      if (
        !(
          blockElement.selected?.is('block') ||
          blockElement.selected?.is('text')
        )
      )
        return;

      const page = blockElement.closest<PageBlockComponent>(
        'affine-doc-page,affine-edgeless-page'
      );
      if (!page) return;

      const textModels = getSelectedContentModels(root, ['text']);
      if (textModels.length === 1) {
        const vEditor = _getVirgo();
        const vRange = vEditor.getVRange();
        assertExists(vRange);
        handleUnindent(model.page, model, vRange.index);
        _preventDefault(ctx);

        return true;
      }

      const models = getSelectedContentModels(root, ['text', 'block']);
      handleMultiBlockOutdent(blockElement.page, models);
      return true;
    },
    Backspace: ctx => {
      if (!blockElement.selected?.is('text')) return;
      const state = ctx.get('keyboardState');
      const vEditor = _getVirgo();
      if (!onBackspace(model, state.raw, vEditor)) {
        _preventDefault(ctx);
      }

      // Auto delete bracket right
      if (matchFlavours(blockElement.model, ['affine:code'])) {
        const vRange = vEditor.getVRange();
        assertExists(vRange);
        const left = vEditor.yText.toString()[vRange.index - 1];
        const right = vEditor.yText.toString()[vRange.index];
        if (bracketPairs[leftBrackets.indexOf(left)]?.right === right) {
          const index = vRange.index - 1;
          vEditor.deleteText({
            index: index,
            length: 2,
          });
          vEditor.setVRange({
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

    blockElement.bindHotKey({
      [config.hotkey]: ctx => {
        if (blockElement.page.readonly) return;

        const textSelection = blockElement.selection.find('text');
        if (!textSelection) return;

        _preventDefault(ctx);

        config.action(root);
        return true;
      },
    });
  });

  function handleDelete(ctx: UIEventStateContext) {
    if (!blockElement.selected?.is('text')) return;
    const state = ctx.get('keyboardState');
    const vEditor = _getVirgo();
    if (!onForwardDelete(model, state.raw, vEditor)) {
      _preventDefault(ctx);
    }
    return true;
  }

  function tryConvertToLinkedPage() {
    const pageBlock = blockElement.root.view.viewFromPath(
      'block',
      buildPath(model.page.root)
    );
    assertExists(pageBlock);
    const linkedPageWidgetEle =
      pageBlock.widgetElements['affine-linked-page-widget'];
    if (!linkedPageWidgetEle) return false;

    const vEditor = _getVirgo();
    const vRange = vEditor.getVRange();
    assertExists(vRange);
    const text = vEditor.yText.toString();
    const left = text[vRange.index - 1];
    const right = text[vRange.index + vRange.length];
    const needConvert = left === '[' && right === ']';
    if (!needConvert) return false;

    const pageName = text.slice(vRange.index, vRange.index + vRange.length);
    vEditor.deleteText({
      index: vRange.index - 1,
      length: vRange.length + 2,
    });
    vEditor.setVRange({ index: vRange.index - 1, length: 0 });

    createPage(blockElement.page.workspace, {
      title: pageName,
    })
      .then(page => {
        insertLinkedNode({ model: blockElement.model, pageId: page.id });
      })
      .catch(e => console.error(e));
    return true;
  }

  // Bracket auto complete
  bracketPairs.forEach(pair => {
    blockElement.bindHotKey({
      [pair.left]: ctx => {
        if (blockElement.page.readonly) return;

        const textSelection = blockElement.selection.find('text');
        if (!textSelection) return;
        // When selection is collapsed, only trigger auto complete in code block
        if (
          textSelection.isCollapsed() &&
          !matchFlavours(blockElement.model, ['affine:code'])
        )
          return;
        if (!textSelection.isInSameBlock()) return;

        _preventDefault(ctx);

        const vEditor = _getVirgo();
        const vRange = vEditor.getVRange();
        assertExists(vRange);
        const selectedText = vEditor.yText
          .toString()
          .slice(vRange.index, vRange.index + vRange.length);
        if (pair.name === 'square bracket') {
          // [[Selected text]] should automatically be converted to a Linked page with the title "Selected text".
          // See https://github.com/toeverything/blocksuite/issues/2730
          const success = tryConvertToLinkedPage();
          if (success) return;
        }
        vEditor.insertText(vRange, pair.left + selectedText + pair.right);

        vEditor.setVRange({
          index: vRange.index + 1,
          length: vRange.length,
        });

        return true;
      },
    });
  });

  // Skip redundant right bracket
  bracketPairs.forEach(pair => {
    blockElement.bindHotKey({
      [pair.right]: ctx => {
        if (!matchFlavours(blockElement.model, ['affine:code'])) return;
        const vEditor = _getVirgo();
        const vRange = vEditor.getVRange();
        assertExists(vRange);
        const left = vEditor.yText.toString()[vRange.index - 1];
        const right = vEditor.yText.toString()[vRange.index];
        if (pair.left === left && pair.right === right) {
          vEditor.setVRange({
            index: vRange.index + 1,
            length: 0,
          });
          _preventDefault(ctx);
        }
      },
    });
  });

  // Convert the selected text into inline code
  blockElement.bindHotKey({
    '`': ctx => {
      if (blockElement.page.readonly) return;

      const textSelection = blockElement.selection.find('text');
      if (!textSelection || textSelection.isCollapsed()) return;
      if (!textSelection.isInSameBlock()) return;

      _preventDefault(ctx);
      const vEditor = _getVirgo();
      const vRange = vEditor.getVRange();
      assertExists(vRange);
      vEditor.formatText(vRange, { code: true });

      vEditor.setVRange({
        index: vRange.index,
        length: vRange.length,
      });

      return true;
    },
  });
};
