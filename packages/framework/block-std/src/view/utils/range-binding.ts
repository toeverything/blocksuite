import { assertExists, throttle } from '@blocksuite/global/utils';

import type { BaseSelection, TextSelection } from '../../selection/index.js';
import { PathFinder } from '../../utils/index.js';
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

  isComposing = false;
  private _prevTextSelection: TextSelection | null = null;
  private _onStdSelectionChanged = (selections: BaseSelection[]) => {
    // wait for lit updated
    this.host.updateComplete
      .then(() => {
        const text =
          selections.find((selection): selection is TextSelection =>
            selection.is('text')
          ) ?? null;

        const eq =
          text && this._prevTextSelection
            ? text.equals(this._prevTextSelection)
            : text === this._prevTextSelection;
        if (eq) {
          return;
        }

        this._prevTextSelection = text;
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

    if (range) {
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

      this._prevTextSelection = this.rangeManager.rangeToTextSelection(
        range,
        isRangeReversed
      );
      this.rangeManager.syncRangeToTextSelection(range, isRangeReversed);
    } else {
      this._prevTextSelection = null;
      this.selectionManager.clear(['text']);
    }
  };

  private _onBeforeInput = (event: InputEvent) => {
    const selection = this.selectionManager.find('text');
    if (!selection) return;

    if (event.isComposing) return;

    const { from, to } = selection;
    if (!to || PathFinder.equals(from.path, to.path)) return;

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
        path: from.path,
        index: from.index + (event.data?.length ?? 0),
        length: 0,
      },
      to: null,
    });
    this.selectionManager.set([newSelection]);
  };

  private _compositionStartCallback:
    | ((event: CompositionEvent) => Promise<void>)
    | null = null;
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
        const parent = this.host.view.getParent(highestBlock.path)?.view;
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
          path: from.path,
          index: from.index + (event.data?.length ?? 0),
          length: 0,
        },
        to: null,
      });
      this.host.selection.set([selection]);
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
