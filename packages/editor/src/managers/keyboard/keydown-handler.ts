import { getDefaultPageBlock, PageBlockModel } from '@blocksuite/blocks';
import { checkEditorElementActive } from '../../utils/editor.js';

class EditorKeydownHandlerStatic {
  private pageBlockModel: PageBlockModel | null = null;
  private handleCallback = (e: KeyboardEvent) => this.handle(e);
  init(pageBlockModel: PageBlockModel) {
    this.pageBlockModel = pageBlockModel;
    window.addEventListener('keydown', this.handleCallback);
  }

  dispose() {
    window.removeEventListener('keydown', this.handleCallback);
  }

  handle(e: KeyboardEvent) {
    [this.preventKeyC, this.resetSelection].forEach(fn => {
      fn.call(this, e);
    });
  }
  // Question: Why do we prevent this?
  preventKeyC(e: KeyboardEvent) {
    if (e.altKey && e.metaKey && e.code === 'KeyC') {
      e.preventDefault();
    }
  }

  resetSelection(e: KeyboardEvent) {
    // `esc`  clear selection
    if (e.code !== 'Escape') {
      return;
    }
    const pageModel = this.pageBlockModel;
    if (!pageModel) return;
    const pageBlock = getDefaultPageBlock(pageModel);
    pageBlock.selection.clearRects();

    const selection = getSelection();

    if (!selection || selection.isCollapsed || !checkEditorElementActive()) {
      return;
    }
    selection.removeAllRanges();
  }
}

export const EditorKeydownHandler = new EditorKeydownHandlerStatic();
