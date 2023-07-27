import type { DataViewKanban } from './kanban-view.js';

export class KanbanHotkeys {
  constructor(private viewEle: DataViewKanban) {}

  run() {
    return this.viewEle.bindHotkey({
      Escape: () => {
        this.viewEle.selection.focusOut();
      },
      Enter: () => {
        this.viewEle.selection.focusIn();
      },
      ArrowUp: () => {
        this.viewEle.selection.focusUp();
      },
      ArrowDown: () => {
        this.viewEle.selection.focusDown();
      },
      ArrowLeft: () => {
        this.viewEle.selection.focusLeft();
      },
      ArrowRight: () => {
        this.viewEle.selection.focusRight();
      },
    });
  }
}
