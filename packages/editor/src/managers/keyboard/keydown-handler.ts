import {
  DefaultPageBlockComponent,
  getDefaultPageBlock,
  handleIndent,
  PageBlockModel,
} from '@blocksuite/blocks';
import type { Page } from '@blocksuite/store';
import { checkEditorElementActive } from '../../utils/editor.js';

class EditorKeydownHandlerStatic {
  private pageBlockModel: PageBlockModel | null = null;
  private handleCallback = (e: KeyboardEvent) => this.handle(e);
  init(pageBlockModel: PageBlockModel | null) {
    this.pageBlockModel = pageBlockModel;
    window.addEventListener('keydown', this.handleCallback);
  }

  dispose() {
    window.removeEventListener('keydown', this.handleCallback);
  }

  handle(e: KeyboardEvent) {
    [this.preventKeyC, this.resetSelection, this.indentSelectedBlock].forEach(
      fn => {
        fn.call(this, e);
      }
    );
  }
  // Question: Why do we prevent this?
  preventKeyC(e: KeyboardEvent) {
    if (e.altKey && e.metaKey && e.code === 'KeyC') {
      e.preventDefault();
    }
  }

  indentSelectedBlock(e: KeyboardEvent) {
    if (e.code != 'Tab') return;

    const pageModel = this.pageBlockModel;
    if (!pageModel) return;
    const pageBlock = getDefaultPageBlock(pageModel);
    const state = pageBlock.selection.state;

    let page: Page;
    let captureSyncOnce = false;

    for (const block of state.selectedBlocks) {
      const currentBlock = block as DefaultPageBlockComponent;

      const model = currentBlock.model;
      if (!model) continue;
      page = currentBlock.model.page;
      if (!captureSyncOnce) {
        page.captureSync();
        captureSyncOnce = true;
      }

      handleIndent(page, model, 0, false);
    }

    e.preventDefault();
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
