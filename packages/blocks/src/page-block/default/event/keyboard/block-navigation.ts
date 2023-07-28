import type { BlockSelection } from '@blocksuite/block-std';
import type { UIEventHandler } from '@blocksuite/block-std';

import type { DefaultPageBlockComponent } from '../../default-page-block.js';

export class BlockNavigation {
  private _anchorBlock: BlockSelection | null = null;
  private _focusBlock: BlockSelection | null = null;

  constructor(public host: DefaultPageBlockComponent) {}

  keyDown: UIEventHandler = () => {
    this._anchorBlock = null;
    this._focusBlock = null;
  };

  ArrowUp: UIEventHandler = () => {
    const selection = this._currentSelection.at(0);
    if (!selection) {
      return;
    }
    const model = this.page.getBlockById(
      this._focusBlock?.blockId || selection.blockId
    );
    if (!model) return;
    const previousSibling = this.page.getPreviousSibling(model);
    if (!previousSibling) return;
    this._focusBlockById(previousSibling.id, selection.path.slice(0, -1));
  };

  ArrowDown: UIEventHandler = () => {
    const selection = this._currentSelection.at(-1);
    if (!selection) {
      return;
    }
    const model = this.page.getBlockById(
      this._focusBlock?.blockId || selection.blockId
    );
    if (!model) return;
    const nextSibling = this.page.getNextSibling(model);
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

    const model = this.page.getBlockById(
      this._focusBlock?.blockId || selection.blockId
    );
    if (!model) return;
    const previousSibling = this.page.getPreviousSibling(model);
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

    const model = this.page.getBlockById(
      this._focusBlock?.blockId || selection.blockId
    );
    if (!model) return;
    const nextSibling = this.page.getNextSibling(model);
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
      blockId,
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
      const view = this.host.root.blockViewMap.get(path);
      view?.scrollIntoView({ block: 'nearest' });
    });
  }

  private get page() {
    return this.host.page;
  }

  private get _selection() {
    return this.host.root.selectionManager;
  }

  private get _currentSelection() {
    return this._selection.value;
  }

  private _focusBlockById(id: string, parentPath: string[]) {
    const block = this.page.getBlockById(id);
    if (!block) return;
    const blockId = block.id;
    const path = parentPath.concat(blockId);
    this._selection.set([
      this._selection.getInstance('block', {
        blockId,
        path,
      }),
    ]);
    requestAnimationFrame(() => {
      const view = this.host.root.blockViewMap.get(path);
      view?.scrollIntoView({ block: 'nearest' });
    });
  }
}
