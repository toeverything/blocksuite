import { assertExists, noop } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { Bound } from '@blocksuite/phasor';
import { type Page } from '@blocksuite/store';
import { css, html, LitElement, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  matchFlavours,
  type TopLevelBlockModel,
} from '../../../../__internal__/index.js';
import {
  CardIcon,
  DualLinkIcon,
  HiddenCardIcon,
} from '../../../../icons/index.js';
import type { NoteBlockModel } from '../../../../note-block/note-model.js';
import {
  type DragEvent,
  type FitViewEvent,
  type ReorderEvent,
  type SelectEvent,
  TOCNoteCard,
} from './toc-card.js';
import { TOCBlockPreview } from './toc-preview.js';
import { startDragging } from './utils/drag.js';

type TOCNoteItem = {
  note: NoteBlockModel;

  /**
   * the index of the note inside its parent's children property
   */
  index: number;

  /**
   * the number displayed on the toc panel
   */
  number: number;
};

noop(TOCNoteCard);

export class TOCNotesPanel extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .navigation-panel-container {
      background-color: var(--affine-background-overlay-panel-color);
      padding: 17.5px 16px;
      box-sizing: border-box;

      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 8px;

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

    .panel-info .action .icon,
    .panel-info .action .icon > svg {
      height: 12px;
    }

    .panel-info .count {
      font-family: var(--affine-number-font-family);
      font-weight: 600;
    }

    .panel-list {
      position: relative;
      left: -8px;

      flex-grow: 1;
      width: calc(100% + 4px);
      padding-left: 8px;

      overflow-y: scroll;
    }

    .panel-list .title {
      font-size: 12px;
      line-height: 14.5px;
      font-weight: bolder;
      color: var(--affine-text-secondary-color);
      font-family: var(--affine-font-sans-family);
      padding-left: 16px;
      margin: 21px 0 9px 0;
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
  private _notes: TOCNoteItem[] = [];

  @state()
  private _hiddenNotes: TOCNoteItem[] = [];

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  insertIndex?: number;

  /**
   * store the id of selected notes
   */
  @state()
  private _selected: string[] = [];

  @query('.panel-list')
  panelListElement!: HTMLElement;

  @property({ attribute: false })
  host!: Document | HTMLElement;

  private _noteElementHeight = 0;
  private _changedFlag = false;
  private _oldViewport?: {
    zoom: number;
    center: {
      x: number;
      y: number;
    };
  };

  get edgeless() {
    return this.ownerDocument.querySelector('affine-edgeless-page');
  }

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

  override disconnectedCallback(): void {
    super.disconnectedCallback();

    if (!this._changedFlag && this._oldViewport) {
      const edgeless = this.edgeless;

      if (!edgeless) return;

      edgeless.surface.viewport.setViewport(
        this._oldViewport.zoom,
        [this._oldViewport.center.x, this._oldViewport.center.y],
        true
      );
    }
  }

  private _updateNotes() {
    const root = this.page.root;

    if (!root) {
      this._notes = [];
      return;
    }

    const visibleNotes: TOCNotesPanel['_notes'] = [];
    const hiddenNotes: TOCNotesPanel['_notes'] = [];
    const oldSelectedSet = this._selected.reduce((pre, id) => {
      pre.add(id);
      return pre;
    }, new Set<string>());
    const newSelected: string[] = [];

    root.children.forEach((block, index) => {
      if (!matchFlavours(block, ['affine:note'])) return;

      const tocNoteItem = {
        note: block as TopLevelBlockModel,
        index,
        number: index + 1,
      };

      if (block.hidden) {
        hiddenNotes.push(tocNoteItem);
      } else {
        visibleNotes.push(tocNoteItem);
        if (oldSelectedSet.has(block.id)) {
          newSelected.push(block.id);
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

    this._changedFlag = true;
    this.page.moveBlocks(
      [note.note],
      root,
      siblingNote.note,
      targetNumber < currentNumber
    );
  }

  private _moveBlocks(
    index: number,
    selected: string[],
    notesMap: Map<string, TOCNoteItem>,
    notes: TOCNoteItem[]
  ) {
    const children = this.page.root?.children.slice() as NoteBlockModel[];

    if (!children || !this.page.root) return;

    const blocks = selected.map(id => (notesMap.get(id) as TOCNoteItem).note);
    const draggingBlocks = new Set(blocks);
    const targetIndex =
      index === notes.length
        ? this._notes[index - 1].index + 1
        : this._notes[index].index;

    const leftPart = children
      .slice(0, targetIndex)
      .filter(block => !draggingBlocks.has(block));
    const rightPart = children
      .slice(targetIndex)
      .filter(block => !draggingBlocks.has(block));
    const newChildren = [...leftPart, ...blocks, ...rightPart];

    this._changedFlag = true;
    this.page.updateBlock(this.page.root, {
      children: newChildren,
    });
  }

  private _selectNote(e: SelectEvent) {
    const { selected, id, multiselect } = e.detail;

    if (!selected) {
      this._selected = this._selected.filter(noteId => noteId !== id);
    } else if (multiselect) {
      this._selected.push(id);
      this.requestUpdate('_selected');
    } else {
      this._selected = [id];
    }

    this.edgeless?.selectionManager.setSelection({
      elements: this._selected,
      editing: false,
    });
  }

  private _drag(e: DragEvent) {
    this._dragging = true;

    // cache the notes in case it is changed by other peers
    const notes = this._notes;
    const notesMap = this._notes.reduce((map, note, index) => {
      map.set(note.note.id, {
        ...note,
        number: index + 1,
      });
      return map;
    }, new Map<string, TOCNoteItem>());

    const draggedNotesInfo = this._selected.map(id => {
      const note = notesMap.get(id) as TOCNoteItem;

      return {
        note: note.note,
        element: this.renderRoot.querySelector(
          `[data-note-id="${note.note.id}"]`
        ) as TOCNoteCard,
        index: note.index,
        number: note.number,
      };
    });

    this._noteElementHeight = draggedNotesInfo[0].element.offsetHeight;
    const width = draggedNotesInfo[0].element.clientWidth;

    startDragging(draggedNotesInfo, {
      width,
      container: this,
      doc: this.ownerDocument,
      host: this.host ?? this.ownerDocument,
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

        this._moveBlocks(insertIdx, this._selected, notesMap, notes);
      },
      onDragMove: idx => {
        this.insertIndex = idx;
      },
    });
  }

  override firstUpdated(): void {
    this._zoomToFit();
  }

  private _zoomToFit() {
    const edgeless = this.edgeless;

    if (!edgeless) return;

    const { surface } = edgeless;
    const { centerX, centerY, zoom } = edgeless.getFitToScreenData([
      undefined,
      this.offsetWidth,
      undefined,
      undefined,
    ]);

    this._oldViewport = {
      zoom: surface.viewport.zoom,
      center: {
        x: surface.viewport.center.x,
        y: surface.viewport.center.y,
      },
    };
    surface.viewport.setViewport(zoom, [centerX, centerY], true);
  }

  private _fitToElement(e: FitViewEvent) {
    const edgeless = this.edgeless;

    if (!edgeless) return;

    const { block } = e.detail;
    const bound = Bound.deserialize(block.xywh);

    edgeless.surface.viewport.setViewportByBound(
      bound,
      [50, 400, 50, 50],
      true
    );
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
          <div
            class="panel-info"
            style="cursor: pointer;"
            @click=${this._jumpToHidden}
          >
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
                    .status=${selectedNotesSet.has(note.note.id)
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
                    @fitview=${this._fitToElement}
                  ></edgeless-note-toc-card>
                `
              )
            : html`${nothing}`}
          ${this._hiddenNotes.length > 0
            ? html`<div class="title">Hidden on Page</div>`
            : nothing}
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
                  @fitview=${this._fitToElement}
                ></edgeless-note-toc-card>`
              )
            : nothing}
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

const componentsMap = {
  'edgeless-note-toc-card': TOCNoteCard,
  'edgeless-toc-block-preview': TOCBlockPreview,
  'edgeless-toc-notes-panel': TOCNotesPanel,
};

export function registerTOCComponents(
  callback: (components: typeof componentsMap) => void
) {
  callback(componentsMap);
}
