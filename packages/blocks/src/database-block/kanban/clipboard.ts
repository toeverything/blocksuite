import type { UIEventStateContext } from '@blocksuite/block-std';

import {
  BaseViewClipboard,
  type BaseViewClipboardConfig,
} from '../common/clipboard.js';
import type { DataViewKanban } from './kanban-view.js';
import type { DataViewKanbanManager } from './kanban-view-manager.js';

interface KanbanViewClipboardConfig
  extends BaseViewClipboardConfig<DataViewKanbanManager> {
  view: DataViewKanban;
}

export class KanbanViewClipboard extends BaseViewClipboard<DataViewKanbanManager> {
  private _view: DataViewKanban;

  constructor(config: KanbanViewClipboardConfig) {
    super(config);

    this._view = config.view;
  }

  override init() {
    this._disposables.add(
      this._view.handleEvent('copy', ctx => {
        this._onCopy(ctx);
        return true;
      })
    );

    this._disposables.add(
      this._view.handleEvent('paste', ctx => {
        this._onPaste(ctx);
        return true;
      })
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
