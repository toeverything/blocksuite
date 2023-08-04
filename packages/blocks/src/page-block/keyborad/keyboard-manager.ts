import type { PageBlockComponent } from '../types.js';

export class PageKeyboardManager {
  constructor(public host: PageBlockComponent) {
    this.host.bindHotKey({
      'Mod-z': ctx => {
        ctx.get('defaultState').event.preventDefault();
        if (this._page.canUndo) {
          this._page.undo();
        }
      },
      'Mod-Z': ctx => {
        ctx.get('defaultState').event.preventDefault();
        if (this._page.canRedo) {
          this._page.redo();
        }
      },
    });
  }

  private get _page() {
    return this.host.page;
  }
}
