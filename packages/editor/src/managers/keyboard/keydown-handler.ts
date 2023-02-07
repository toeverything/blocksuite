import {
  DefaultPageBlockComponent,
  getDefaultPageBlock,
  getRichTextByModel,
  handleIndent,
  PageBlockModel,
  ParagraphBlockComponent,
  supportsChildren,
} from '@blocksuite/blocks';
import type { Page } from '@blocksuite/store';
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
    [this.preventKeyC, this.resetSelection, this.intentSelectedBlock].forEach(
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

  intentSelectedBlock(e: KeyboardEvent) {
    if (e.code != 'Tab') return;

    const pageModel = this.pageBlockModel;
    if (!pageModel) return;
    const pageBlock = getDefaultPageBlock(pageModel);
    const state = pageBlock.selection.state;
    let page: Page;
    let captureSyncOnce = false;
    // TODO: merge util `handleIndent` at `rich-text-operations.ts`
    for (const block of state.selectedBlocks) {
      const currentBlock = block as DefaultPageBlockComponent;

      const model = currentBlock.model;
      if (!model) return;
      page = currentBlock.model.page;
      if (!captureSyncOnce) {
        page.captureSync();
        captureSyncOnce = true;
      }

      const previousSibling = currentBlock.model.page.getPreviousSibling(
        currentBlock.model
      );
      if (!previousSibling || !supportsChildren(previousSibling)) {
        // Bottom, can not indent, do nothing
        return;
      }

      const parent = page.getParent(model);
      if (!parent) return;

      // 1. backup target block children and remove them from target block
      const children = model.children;
      page.updateBlock(model, {
        children: [],
      });

      // 2. remove target block from parent block
      page.updateBlock(parent, {
        children: parent.children.filter(child => child.id !== model.id),
      });

      // 3. append target block and children to previous sibling block
      page.updateBlock(previousSibling, {
        children: [...previousSibling.children, model, ...children],
      });
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
