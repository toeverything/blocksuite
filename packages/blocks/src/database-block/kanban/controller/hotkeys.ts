import type { ReactiveController } from 'lit';

import type { DataViewKanban } from '../kanban-view.js';

export class KanbanHotkeysController implements ReactiveController {
  constructor(private host: DataViewKanban) {
    this.host.addController(this);
  }

  public hostConnected() {
    this.host.disposables.add(
      this.host.bindHotkey({
        Escape: () => {
          this.host.selectionController.focusOut();
          return true;
        },
        Enter: () => {
          this.host.selectionController.focusIn();
        },
        ArrowUp: context => {
          this.host.selectionController.focusNext('up');
          context.get('keyboardState').raw.preventDefault();
          return true;
        },
        ArrowDown: context => {
          this.host.selectionController.focusNext('down');
          context.get('keyboardState').raw.preventDefault();
          return true;
        },
        ArrowLeft: context => {
          this.host.selectionController.focusNext('left');
          context.get('keyboardState').raw.preventDefault();
          return true;
        },
        ArrowRight: context => {
          this.host.selectionController.focusNext('right');
          context.get('keyboardState').raw.preventDefault();
          return true;
        },
        Backspace: () => {
          this.host.selectionController.deleteCard();
        },
      })
    );
  }
}
