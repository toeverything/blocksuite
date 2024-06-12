import type { UIEventStateContext } from '@blocksuite/block-std';
import type { ReactiveController } from 'lit';

import type { DataViewKanban } from '../kanban-view.js';
import type { KanbanViewSelectionWithType } from '../types.js';

export class KanbanClipboardController implements ReactiveController {
  private get readonly() {
    return this.host.view.readonly;
  }

  constructor(public host: DataViewKanban) {
    host.addController(this);
  }

  private _onCopy = (
    _context: UIEventStateContext,
    _kanbanSelection: KanbanViewSelectionWithType
  ) => {
    // todo
    return true;
  };

  private _onPaste = (_context: UIEventStateContext) => {
    // todo
    return true;
  };

  hostConnected() {
    this.host.disposables.add(
      this.host.handleEvent('copy', ctx => {
        const kanbanSelection = this.host.selectionController.selection;
        if (!kanbanSelection) return false;

        this._onCopy(ctx, kanbanSelection);
        return true;
      })
    );

    this.host.disposables.add(
      this.host.handleEvent('paste', ctx => {
        if (this.readonly) return false;

        this._onPaste(ctx);
        return true;
      })
    );
  }
}
