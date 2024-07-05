import { assertExists, throttle } from '@blocksuite/global/utils';

import type { BaseSelection, TextSelection } from '../../selection/index.js';
import { BlockElement } from '../element/block-element.js';
import { RangeManager } from './range-manager.js';

/**
 * Two-way binding between native range and text selection
 */
export class RangeBinding {
  get selectionManager() {
    return this.host.selection;
  }

  get rangeManager() {
    assertExists(this.host.rangeManager);
    return this.host.rangeManager;
  }

  get host() {
    return this.manager.host;
  }

  private _prevTextSelection: {
    selection: TextSelection;
    path: string[];
  } | null = null;

  private _compositionStartCallback:
    | ((event: CompositionEvent) => Promise<void>)
    | null = null;

  isComposing = false;

  constructor(public manager: RangeManager) {
    this.host.disposables.add(
      this.selectionManager.slots.changed.on(this._onStdSelectionChanged)
    );

    this.host.disposables.addFromEvent(
      document,
      'selectionchange',
      throttle(() => {
        this._onNativeSelectionChanged().catch(console.error);
      }, 10)
    );

    this.host.disposables.add(
      this.host.event.add('beforeInput', ctx => {
        const event = ctx.get('defaultState').event as InputEvent;
        this._onBeforeInput(event);
      })
    );

    this.host.disposables.add(
      this.host.event.add('compositionStart', this._onCompositionStart)
    );
    this.host.disposables.add(
      this.host.event.add('compositionEnd', ctx => {
        const event = ctx.get('defaultState').event as CompositionEvent;
        this._onCompositionEnd(event);
      })
    );
  }

  private _onStdSelectionChanged = (selections: BaseSelection[]) => {
    const text =
      selections.find((selection): selection is TextSelection =>
        selection.is('text')
      ) ?? null;

    if (text === this._prevTextSelection) {
      return;
    }

    // wait for lit updated
    this.host.updateComplete
      .then(() => {
        const model = text && this.host.doc.getBlockById(text.blockId);
        const path = model && this.host.view.calculatePath(model);

        const eq =
          text && this._prevTextSelection && path
            ? text.equals(this._prevTextSelection.selection) &&
              path.join('') === this._prevTextSelection.path.join('')
            : false;

        if (eq) {
          return;
        }

        this._prevTextSelection =
          text && path
            ? {
                selection: text,
                path: path,
              }
            : null;
        if (text) {
          this.rangeManager.syncTextSelectionToRange(text);
        } else {
          this.rangeManager.clear();
        }
      })
      .catch(console.error);
  };

  private _onNativeSelectionChanged = async () => {
    if (this.isComposing) return;

    await this.host.updateComplete;

    const selection = document.getSelection();
    if (!selection) {
      this.selectionManager.clear(['text']);
      return;
    }
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    const isRangeReversed =
      !!selection.anchorNode &&
      !!selection.focusNode &&
      (selection.anchorNode === selection.focusNode
        ? selection.anchorOffset > selection.focusOffset
        : selection.anchorNode.compareDocumentPosition(selection.focusNode) ===
          Node.DOCUMENT_POSITION_PRECEDING);

    if (!range) {
      this._prevTextSelection = null;
      this.selectionManager.clear(['text']);
      return;
    }

    // range is in a non-editable element
    // ex. placeholder
    const isRangeOutNotEditable =
      (range.startContainer instanceof HTMLElement &&
        range.startContainer.contentEditable === 'false') ||
      (range.endContainer instanceof HTMLElement &&
        range.endContainer.contentEditable === 'false');
    if (isRangeOutNotEditable) {
      this._prevTextSelection = null;
      this.selectionManager.clear(['text']);

      // force clear native selection to break inline editor input
      selection.removeRange(range);
      return;
    }

    const el =
      range.commonAncestorContainer instanceof Element
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement;
    if (!el) return;
    const block = el.closest<BlockElement>(`[${this.host.blockIdAttr}]`);
    if (block?.getAttribute(RangeManager.rangeSyncExcludeAttr) === 'true')
      return;

    const inlineEditor = this.rangeManager.getClosestInlineEditor(
      range.commonAncestorContainer
    );
    if (inlineEditor?.isComposing) return;

    const textSelection = this.rangeManager.rangeToTextSelection(
      range,
      isRangeReversed
    );
    if (!textSelection) {
      this._prevTextSelection = null;
      this.selectionManager.clear(['text']);
      return;
    }

    const model = this.host.doc.getBlockById(textSelection.blockId);
    // If the model is not found, the selection maybe in another editor
    if (!model) return;

    const path = this.host.view.calculatePath(model);
    this._prevTextSelection = {
      selection: textSelection,
      path,
    };
    this.rangeManager.syncRangeToTextSelection(range, isRangeReversed);
  };

  private _onBeforeInput = (event: InputEvent) => {
    const selection = this.selectionManager.find('text');
    if (!selection) return;

    if (event.isComposing) return;

    const { from, to } = selection;
    if (!to || from.blockId === to.blockId) return;

    const range = this.rangeManager.value;
    if (!range) return;

    const blocks = this.rangeManager.getSelectedBlockElementsByRange(range, {
      mode: 'flat',
    });

    const start = blocks.at(0);
    const end = blocks.at(-1);
    if (!start || !end) return;

    const startText = start.model.text;
    const endText = end.model.text;
    if (!startText || !endText) return;

    event.preventDefault();

    this.host.doc.transact(() => {
      startText.delete(from.index, from.length);
      startText.insert(event.data ?? '', from.index);
      endText.delete(0, to.length);
      startText.join(endText);

      blocks
        .slice(1)
        // delete from lowest to highest
        .reverse()
        .forEach(block => {
          const parent = this.host.doc.getParent(block.model);
          assertExists(parent);
          this.host.doc.deleteBlock(block.model, {
            bringChildrenTo: parent,
          });
        });
    });

    const newSelection = this.selectionManager.create('text', {
      from: {
        blockId: from.blockId,
        index: from.index + (event.data?.length ?? 0),
        length: 0,
      },
      to: null,
    });
    this.selectionManager.setGroup('note', [newSelection]);
  };

  private _onCompositionStart = () => {
    const selection = this.selectionManager.find('text');
    if (!selection) return;

    const { from, to } = selection;
    if (!to) return;

    this.isComposing = true;

    const range = this.rangeManager.value;
    if (!range) return;

    const blocks = this.rangeManager.getSelectedBlockElementsByRange(range, {
      mode: 'flat',
    });
    const highestBlocks = this.rangeManager.getSelectedBlockElementsByRange(
      range,
      {
        mode: 'highest',
        match: block => block.model.role === 'content',
      }
    );

    const start = blocks.at(0);
    const end = blocks.at(-1);
    if (!start || !end) return;

    const startText = start.model.text;
    const endText = end.model.text;
    if (!startText || !endText) return;

    this._compositionStartCallback = async event => {
      this.isComposing = false;

      const parents: BlockElement[] = [];
      for (const highestBlock of highestBlocks) {
        const parentModel = this.host.doc.getParent(highestBlock.blockId);
        if (!parentModel) continue;
        const parent = this.host.view.getBlock(parentModel.id);
        if (!(parent instanceof BlockElement) || parents.includes(parent))
          continue;

        // Restore the DOM structure damaged by the composition
        parent.dirty = true;
        await parent.updateComplete;
        await parent.updateComplete;
        parents.push(parent);
      }

      this.host.doc.transact(() => {
        endText.delete(0, to.length);
        startText.join(endText);

        blocks
          .slice(1)
          // delete from lowest to highest
          .reverse()
          .forEach(block => {
            const parent = this.host.doc.getParent(block.model);
            assertExists(parent);
            this.host.doc.deleteBlock(block.model, {
              bringChildrenTo: parent,
            });
          });
      });

      await this.host.updateComplete;

      const selection = this.selectionManager.create('text', {
        from: {
          blockId: from.blockId,
          index: from.index + (event.data?.length ?? 0),
          length: 0,
        },
        to: null,
      });
      this.host.selection.setGroup('note', [selection]);
      this.rangeManager.syncTextSelectionToRange(selection);
    };
  };

  private _onCompositionEnd = (event: CompositionEvent) => {
    if (this._compositionStartCallback) {
      event.preventDefault();
      this._compositionStartCallback(event).catch(console.error);
      this._compositionStartCallback = null;
    }
  };
}
