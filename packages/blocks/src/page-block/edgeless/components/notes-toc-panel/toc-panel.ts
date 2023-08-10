import {
  CardIcon,
  DualLinkIcon,
  HiddenCardIcon,
} from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import { Bound } from '@blocksuite/phasor/index.js';
import { assertExists, matchFlavours, type Page } from '@blocksuite/store';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  noop,
  pickArray,
  type TopLevelBlockModel,
} from '../../../../__internal__/index.js';
import type { NoteBlockModel } from '../../../../note-block/note-model.js';
import {
  type DragEvent,
  type FitViewEvent,
  type ReorderEvent,
  type SelectEvent,
  TOCNoteCard,
} from './toc-card.js';
import { createDrag } from './utils/drag.js';

noop(TOCNoteCard);

@customElement('edgeless-toc-notes-panel')
export class TOCNotesPanel extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .navigation-panel-container {
      background-color: var(--affine-background-overlay-panel-color);
      padding: 17.5px 18.5px;
      box-sizing: border-box;

      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 12px;

      height: 100%;
    }

    .panel-header {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .panel-info {
      font-size: 12px;
      font-family: var(--affine-font-family);
      color: var(--affine-text-secondary-color);

      display: flex;
      align-items: center;
      gap: 14px;
      align-self: stretch;
      height: 20px;
    }

    .panel-info .content {
      flex: 1 0 0;
    }

    .panel-info .icon {
      height: 16px;
      color: var(--affine-icon-color);
      fill: currentColor;
    }

    .panel-info .icon > svg {
      height: 16px;
    }

    .panel-info .action {
      display: flex;
      align-items: center;
    }

    .panel-info .action .icon {
      cursor: pointer;
      height: 12px;
    }

    .panel-info .action .icon > svg {
      height: 12px;
      cursor: pointer;
    }

    .panel-info .count {
      font-family: var(--affine-number-font-family);
      font-weight: 600;
    }

    .panel-list {
      flex-grow: 1;
      overflow: scroll;
      position: relative;
    }

    .insert-indicator {
      height: 2px;
      border-radius: 1px;
      background-color: var(--affine-blue-affine-blue-600, #1e96eb);
      position: absolute;
      contain: layout size;
      width: 235px;
      left: 16px;
    }
  `;

  @state()
  private _dragging = false;

  @state()
  private _notes: {
    note: NoteBlockModel;
    index: number;
  }[] = [];

  @state()
  private _hiddenNotes: {
    note: NoteBlockModel;
    index: number;
  }[] = [];

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  insertIndex?: number;

  /**
   * store the index of selected notes
   */
  @state()
  private _selected: number[] = [];

  @query('.panel-list')
  panelListElement!: HTMLElement;

  private _noteElementHeight = 0;

  override connectedCallback(): void {
    super.connectedCallback();

    const { slots, root } = this.page;
    const slotsForUpdate = root
      ? [root.childrenUpdated, slots.blockUpdated]
      : [slots.blockUpdated];

    slots.rootAdded.on(root => {
      this._disposables.add(root.childrenUpdated.on(() => this._updateNotes()));
    });

    slotsForUpdate.forEach(slot => {
      this._disposables.add(slot.on(() => this._updateNotes()));
    });

    this._updateNotes();
  }

  private _updateNotes() {
    const root = this.page.root;

    if (!root) {
      this._notes = [];
      return;
    }

    const visibleNotes: TOCNotesPanel['_notes'] = [];
    const hiddenNotes: TOCNotesPanel['_notes'] = [];
    const oldNotes = this._notes;
    const oldSelectedSet = this._selected.reduce((pre, idx) => {
      pre.add(oldNotes[idx].note);
      return pre;
    }, new Set<TopLevelBlockModel>());
    const newSelected: number[] = [];

    root.children.forEach((block, index) => {
      if (!matchFlavours(block, ['affine:note'])) return;

      const blockInfo = {
        note: block as TopLevelBlockModel,
        index,
      };

      if (block.hidden) {
        hiddenNotes.push(blockInfo);
      } else {
        visibleNotes.push(blockInfo);
        if (oldSelectedSet.has(block)) {
          newSelected.push(visibleNotes.length - 1);
        }
      }
    });

    this._notes = visibleNotes;
    this._hiddenNotes = hiddenNotes;
    this._selected = newSelected;
  }

  private _reorder(e: ReorderEvent) {
    if (e.detail.targetNumber > this._notes.length) {
      return;
    }

    const { currentNumber, targetNumber } = e.detail;

    const note = this._notes[currentNumber - 1];
    const siblingNote = this._notes[targetNumber - 1];
    const root = this.page.root;

    assertExists(root);

    this.page.moveBlocks(
      [note.note],
      root,
      siblingNote.note,
      targetNumber < currentNumber
    );
  }

  private _moveBlocks(index: number, selected: number[]) {
    const children = this.page.root?.children.slice() as NoteBlockModel[];

    if (!children || !this.page.root) return;

    const blocks = selected.map(idx => this._notes[idx].note);
    const draggingBlocks = new Set(blocks);
    const targetIndex =
      index === this._notes.length
        ? this._notes[index - 1].index + 1
        : this._notes[index].index;

    const leftPart = children
      .slice(0, targetIndex)
      .filter(block => !draggingBlocks.has(block));
    const rightPart = children
      .slice(targetIndex)
      .filter(block => !draggingBlocks.has(block));
    const newChildren = [...leftPart, ...blocks, ...rightPart];

    this.page.updateBlock(this.page.root, {
      children: newChildren,
    });
  }

  private _selectNote(e: SelectEvent) {
    const { number, selected } = e.detail;
    const actualIndex = number - 1;

    if (selected) {
      this._selected.push(actualIndex);
    } else {
      this._selected = this._selected.filter(order => order !== actualIndex);
    }

    this.requestUpdate('_selected');
  }

  private _drag(e: DragEvent) {
    this._dragging = true;

    const draggedNotesInfo = pickArray(this._notes, this._selected).map(
      (note, index) => {
        return {
          note: note.note,
          element: this.renderRoot.querySelector(
            `[data-note-id="${note.note.id}"]`
          ) as TOCNoteCard,
          index: note.index,
          number: this._selected[index] + 1,
        };
      }
    );

    this._noteElementHeight = draggedNotesInfo[0].element.offsetHeight;

    createDrag(draggedNotesInfo, {
      doc: this.ownerDocument,
      page: this.page,
      start: {
        x: e.detail.clientX,
        y: e.detail.clientY,
      },
      tocListContainer: this.panelListElement,
      onDragEnd: insertIdx => {
        this._dragging = false;
        this.insertIndex = undefined;

        if (insertIdx === undefined) return;

        this._moveBlocks(insertIdx, this._selected);
      },
      onDragMove: idx => {
        this.insertIndex = idx;
      },
    });
  }

  private _fitView(e: FitViewEvent) {
    const page = this.ownerDocument.querySelector('affine-edgeless-page');

    if (!page) return;

    const { block } = e.detail;
    const bound = Bound.deserialize(block.xywh);

    page.surface.viewport.setViewportByBound(bound, [100, 100, 100, 100], true);
  }

  private _jumpToHidden() {
    if (!this._hiddenNotes.length) return;

    const id = this._hiddenNotes[0].note.id;
    const element = this.renderRoot.querySelector(`[data-note-id="${id}"]`);

    element?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  override render() {
    const selectedNotesSet = new Set(this._selected);

    return html`
      <div class="navigation-panel-container">
        <div class="panel-header">
          <div class="panel-info">
            <span class="icon">${CardIcon}</span>
            <span class="content">
              <span class="count">${this._notes.length}</span> cards show on
              page
            </span>
          </div>
          <div class="panel-info">
            <span class="icon">${HiddenCardIcon}</span>
            <span class="content">
              <span class="count">${this._hiddenNotes.length}</span> cards
              hidden
            </span>
            <span class="action">
              <span
                class="icon"
                role="button"
                style="position: relative; top: 1px;"
                @click=${this._jumpToHidden}
              >
                ${DualLinkIcon}
              </span>
            </span>
          </div>
        </div>
        <div class="panel-list">
          ${this.insertIndex !== undefined
            ? html`<div
                class="insert-indicator"
                style="transform: translateY(${this.insertIndex *
                  this._noteElementHeight +
                10}px)"
              ></div>`
            : nothing}
          ${this._notes.length
            ? repeat(
                this._notes,
                note => note.note.id,
                (note, idx) => html`
                  <edgeless-note-toc-card
                    data-note-id=${note.note.id}
                    .note=${note.note}
                    .number=${idx + 1}
                    .index=${note.index}
                    .page=${this.page}
                    .status=${selectedNotesSet.has(idx)
                      ? this._dragging
                        ? 'placeholder'
                        : 'selected'
                      : undefined}
                    style=${this.insertIndex !== undefined &&
                    idx >= this.insertIndex
                      ? 'transform: translateY(20px)'
                      : ''}
                    @reorder=${this._reorder}
                    @select=${this._selectNote}
                    @drag=${this._drag}
                    @fitview=${this._fitView}
                  ></edgeless-note-toc-card>
                `
              )
            : html`${nothing}`}
          ${this._hiddenNotes.length
            ? repeat(
                this._hiddenNotes,
                note => note.note.id,
                (note, idx) => html`<edgeless-note-toc-card
                  data-note-id=${note.note.id}
                  .note=${note.note}
                  .number=${idx + 1}
                  .index=${note.index}
                  .page=${this.page}
                  .invisible=${true}
                  style=${this.insertIndex !== undefined
                    ? 'transform: translateY(20px)'
                    : ''}
                ></edgeless-note-toc-card>`
              )
            : html`${nothing}`}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-toc-notes-panel': TOCNotesPanel;
  }
}
