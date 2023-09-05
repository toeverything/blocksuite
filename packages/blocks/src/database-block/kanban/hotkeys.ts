import type { DataViewKanban } from './kanban-view.js';

export class KanbanHotkeys {
  constructor(private viewEle: DataViewKanban) {}

  run() {
    return this.viewEle.bindHotkey({
      Escape: () => {
        this.viewEle.selection.focusOut();
        return true;
      },
      Enter: () => {
        this.viewEle.selection.focusIn();
      },
      ArrowUp: context => {
        this.viewEle.selection.focusNext('up');
        context.get('keyboardState').raw.preventDefault();
        return true;
      },
      ArrowDown: context => {
        this.viewEle.selection.focusNext('down');
        context.get('keyboardState').raw.preventDefault();
        return true;
      },
      ArrowLeft: context => {
        this.viewEle.selection.focusNext('left');
        context.get('keyboardState').raw.preventDefault();
        return true;
      },
      ArrowRight: context => {
        this.viewEle.selection.focusNext('right');
        context.get('keyboardState').raw.preventDefault();
        return true;
      },
      Backspace: () => {
        this.viewEle.selection.deleteCard();
      },
    });
  }
}
