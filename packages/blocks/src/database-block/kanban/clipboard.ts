import type { UIEventStateContext } from '@blocksuite/block-std';
import type { BlockSuiteRoot } from '@blocksuite/lit';

import {
  BaseViewClipboard,
  type BaseViewClipboardConfig,
  getDatabaseSelection,
} from '../common/clipboard.js';
import type { DataViewManager } from '../common/data-view-manager.js';
import type { DataViewKanbanManager } from './kanban-view-manager.js';

interface KanbanViewClipboardConfig extends BaseViewClipboardConfig {
  data: DataViewManager;
}

export class KanbanViewClipboard extends BaseViewClipboard {
  private _data: DataViewKanbanManager;

  constructor(
    private _root: BlockSuiteRoot,
    config: KanbanViewClipboardConfig
  ) {
    super(config);

    this._data = config.data as DataViewKanbanManager;
  }

  override init() {
    const { uiEventDispatcher } = this._root;

    this._disposables.add(
      uiEventDispatcher.add(
        'copy',
        ctx => {
          if (!this.isCurrentView(this._data.id)) return false;

          const selection = getDatabaseSelection(this._root);
          const kanbanSelection = selection?.getSelection('kanban');
          if (!kanbanSelection) return false;
          this._onCopy(ctx);
          return true;
        },
        { path: this._path }
      )
    );
    this._disposables.add(
      uiEventDispatcher.add(
        'paste',
        ctx => {
          if (!this.isCurrentView(this._data.id)) return false;

          return this._onPaste(ctx);
        },
        { path: this._path }
      )
    );
  }

  private _onCopy = async (_context: UIEventStateContext) => {
    // todo
    return true;
  };

  private _onPaste = (_context: UIEventStateContext) => {
    // todo
    return true;
  };
}
