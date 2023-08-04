import type { BlockSelection } from '@blocksuite/block-std';
import type { UIEventHandler } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { VirgoRootElement } from '@blocksuite/virgo';

import type { PageBlockComponent } from '../types.js';

export class BlockNavigation {
  private _anchorBlock: BlockSelection | null = null;
  private _focusBlock: BlockSelection | null = null;

  constructor(public host: PageBlockComponent) {}

  keyDown: UIEventHandler = () => {
    this._anchorBlock = null;
    this._focusBlock = null;
  };

  Enter: UIEventHandler = () => {
    const selection = this._currentSelection.at(0);
    if (!selection) {
      return;
    }
    const view = this.host.root.viewStore.viewFromPath('block', selection.path);
    if (!view) return;

    if (view.model.text) {
      const virgoRoot = view.querySelector(
        '[data-virgo-root]'
      ) as VirgoRootElement;
      assertExists(virgoRoot);
      const sel = this._selection.getInstance('text', {
        from: {
          path: selection.path,
          index: virgoRoot.virgoEditor.yText.length,
          length: 0,
        },
        to: null,
      });
      this._selection.set([sel]);
      return;
    }

    const parentPath = view.parentPath;
    const block = this._page.getBlockById(selection.blockId);
    assertExists(block);
    const parent = this._page.getParent(block);
    const index = parent?.children.indexOf(block);
    const blockId = this._page.addBlock(
      'affine:paragraph',
      {},
      parent,
      index ? index + 1 : undefined
    );
    const sel = this._selection.getInstance('text', {
      from: {
        path: parentPath.concat(blockId),
        index: 0,
        length: 0,
      },
      to: null,
    });
    this._selection.set([sel]);
    return;
  };

  ArrowUp: UIEventHandler = () => {
    const selection = this._currentSelection.at(0);
    if (!selection) {
      return;
    }
    const model = this._page.getBlockById(selection.blockId);
    if (!model) return;
    const previousSibling = this._page.getPreviousSibling(model);
    if (!previousSibling) return;
    this._focusBlockById(previousSibling.id, selection.path.slice(0, -1));
  };

  ArrowDown: UIEventHandler = () => {
    const selection = this._currentSelection.at(-1);
    if (!selection) {
      return;
    }
    const model = this._page.getBlockById(selection.blockId);
    if (!model) return;
    const nextSibling = this._page.getNextSibling(model);
    if (!nextSibling) return;
    this._focusBlockById(nextSibling.id, selection.path.slice(0, -1));
    return;
  };

  ShiftArrowUp: UIEventHandler = () => {
    const selection = this._currentSelection.at(0);
    if (!selection) {
      return;
    }
    if (!this._anchorBlock) {
      const anchor = this._currentSelection.at(-1);
      if (!anchor) return;
      this._anchorBlock = anchor;
    }

    const model = this._page.getBlockById(
      this._focusBlock?.blockId || selection.blockId
    );
    if (!model) return;
    const previousSibling = this._page.getPreviousSibling(model);
    if (!previousSibling) return;
    this._focusBlock = this._modeToSelection(
      previousSibling.id,
      selection.path.slice(0, -1)
    );
    this._selectBetween(false);
    return;
  };

  ShiftArrowDown: UIEventHandler = () => {
    const selection = this._currentSelection.at(-1);
    if (!selection) {
      return;
    }
    if (!this._anchorBlock) {
      const anchor = this._currentSelection.at(0);
      if (!anchor) return;
      this._anchorBlock = anchor;
    }

    const model = this._page.getBlockById(
      this._focusBlock?.blockId || selection.blockId
    );
    if (!model) return;
    const nextSibling = this._page.getNextSibling(model);
    if (!nextSibling) return;
    this._focusBlock = this._modeToSelection(
      nextSibling.id,
      selection.path.slice(0, -1)
    );
    this._selectBetween(true);
    return;
  };

  private _modeToSelection(id: string, parentPath: string[]) {
    const blockId = id;
    const path = parentPath.concat(blockId);
    return this._selection.getInstance('block', {
      path,
    });
  }

  private _selectBetween(tail: boolean) {
    const { _anchorBlock, _focusBlock } = this;
    if (!_anchorBlock || !_focusBlock) return;
    if (_anchorBlock.blockId === _focusBlock.blockId) {
      this._selection.set([_focusBlock]);
      return;
    }
    const selections = [...this._selection.value];
    if (
      this._selection.value.every(sel => sel.blockId !== _focusBlock.blockId)
    ) {
      if (tail) {
        selections.push(_focusBlock);
      } else {
        selections.unshift(_focusBlock);
      }
    }
    let start = false;
    const sel = selections.filter(sel => {
      if (
        sel.blockId === _anchorBlock.blockId ||
        sel.blockId === _focusBlock.blockId
      ) {
        start = !start;
        return true;
      }
      return start;
    });

    this._selection.set(sel);

    const path = _focusBlock.path;
    requestAnimationFrame(() => {
      const view = this.host.root.viewStore.viewFromPath('block', path);
      view?.scrollIntoView({ block: 'nearest' });
    });
  }

  private get _page() {
    return this.host.page;
  }

  private get _selection() {
    return this.host.root.selectionManager;
  }

  private get _currentSelection() {
    return this._selection.value;
  }

  private _focusBlockById(id: string, parentPath: string[]) {
    const block = this._page.getBlockById(id);
    if (!block) return;
    const blockId = block.id;
    const path = parentPath.concat(blockId);
    this._selection.set([
      this._selection.getInstance('block', {
        path,
      }),
    ]);
    requestAnimationFrame(() => {
      const view = this.host.root.viewStore.viewFromPath('block', path);
      view?.scrollIntoView({ block: 'nearest' });
    });
  }
}
