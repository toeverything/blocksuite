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
        this.viewEle.selection.focusUp();
        context.get('keyboardState').raw.preventDefault();
        return true;
      },
      ArrowDown: context => {
        this.viewEle.selection.focusDown();
        context.get('keyboardState').raw.preventDefault();
        return true;
      },
      ArrowLeft: context => {
        this.viewEle.selection.focusLeft();
        context.get('keyboardState').raw.preventDefault();
        return true;
      },
      ArrowRight: context => {
        this.viewEle.selection.focusRight();
        context.get('keyboardState').raw.preventDefault();
        return true;
      },
      Backspace: () => {
        this.viewEle.selection.deleteCard();
      },
    });
  }
}
