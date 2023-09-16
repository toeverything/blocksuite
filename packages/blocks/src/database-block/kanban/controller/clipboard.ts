import type { UIEventStateContext } from '@blocksuite/block-std';
import type { ReactiveController } from 'lit';

import type { KanbanViewSelectionWithType } from '../../../__internal__/index.js';
import type { DataViewKanban } from '../kanban-view.js';

export class KanbanClipboardController implements ReactiveController {
  constructor(public host: DataViewKanban) {
    host.addController(this);
  }

  private get readonly() {
    return this.host.view.readonly;
  }

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

  private _onCopy = async (
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
}
