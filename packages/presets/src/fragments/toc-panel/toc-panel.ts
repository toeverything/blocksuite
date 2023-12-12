import type { NoteBlockModel } from '@blocksuite/blocks';
import { Bound } from '@blocksuite/blocks';
import { noop } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { type Page } from '@blocksuite/store';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  type FitViewEvent,
  type SelectEvent,
  TOCNoteCard,
} from './toc-card.js';
import { TOCNoteHeader } from './toc-header.js';
import { TOCBlockPreview } from './toc-preview.js';
import { TOCNotesSettingMenu } from './toc-setting-menu.js';
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

export class TOCNotePanel extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .toc-panel-container {
      background-color: var(--affine-background-primary-color);
      padding: 17.5px 16px;
      box-sizing: border-box;

      display: flex;
      flex-direction: column;
      align-items: stretch;

      height: 100%;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    }

    .panel-list {
      position: relative;
      left: -16px;

      flex-grow: 1;
      width: calc(100% + 4px);
      padding: 0 8px;

      overflow-y: scroll;
    }

    .panel-list .title {
      width: 100%;
      font-size: 14px;
      line-height: 24px;
      font-weight: 500;
      color: var(--affine-text-secondary-color);
      padding-left: 8px;
      height: 40px;
      box-sizing: border-box;
      padding: 8px 8px;
    }

    .insert-indicator {
      height: 2px;
      border-radius: 1px;
      background-color: var(--affine-blue-500);
      position: absolute;
      contain: layout size;
      width: 300px;
      left: 8px;
    }

    .no-note-container {
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    .note-placeholder {
      margin-top: 240px;
      align-self: center;
      width: 190px;
      height: 48px;
      color: var(--affine-text-secondary-color, #8e8d91);
      text-align: center;
      /* light/base */
      font-size: 15px;
      font-style: normal;
      font-weight: 400;
      line-height: 24px;
    }

    .hidden-note-divider {
      width: 100%;
      padding: 10px 8px;
      box-sizing: border-box;
    }

    .hidden-note-divider div {
      height: 0.5px;
      background-color: var(--affine-border-color);
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

  @property({ attribute: false })
  hidePreviewIcon = false;

  /**
   * store the id of selected notes
   */
  @state()
  private _selected: string[] = [];

  @query('.panel-list')
  panelListElement!: HTMLElement;

  @query('.toc-panel-container')
  tocPanelContainer!: HTMLElement;

  @property({ attribute: false })
  host!: Document | HTMLElement;

  @property({ attribute: false })
  fitPadding!: number[];

  private _indicatorTranslateY = 0;
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

  get viewportPadding(): [number, number, number, number] {
    return this.fitPadding
      ? ([0, 0, 0, 0].map((val, idx) =>
          Number.isFinite(this.fitPadding[idx]) ? this.fitPadding[idx] : val
        ) as [number, number, number, number])
      : [0, 0, 0, 0];
  }

  private _toggleHidePreviewIcon = (on: boolean) => {
    this.hidePreviewIcon = on;
  };

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

    if (this._dragging) return;

    if (!root) {
      this._notes = [];
      return;
    }

    const visibleNotes: TOCNotePanel['_notes'] = [];
    const hiddenNotes: TOCNotePanel['_notes'] = [];
    const oldSelectedSet = this._selected.reduce((pre, id) => {
      pre.add(id);
      return pre;
    }, new Set<string>());
    const newSelected: string[] = [];

    root.children.forEach((block, index) => {
      if (!['affine:note'].includes(block.flavour)) return;

      const blockModel = block as NoteBlockModel;
      const tocNoteItem = {
        note: block as NoteBlockModel,
        index,
        number: index + 1,
      };

      if (blockModel.hidden) {
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

  private _moveBlocks(
    index: number,
    selected: string[],
    notesMap: Map<string, TOCNoteItem>,
    notes: TOCNoteItem[],
    children: NoteBlockModel[]
  ) {
    if (!children.length || !this.page.root) return;

    const blocks = selected.map(id => (notesMap.get(id) as TOCNoteItem).note);
    const draggingBlocks = new Set(blocks);
    const targetIndex =
      index === notes.length ? notes[index - 1].index + 1 : notes[index].index;

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
      this._selected = [...this._selected, id];
    } else {
      this._selected = [id];
    }

    this.edgeless?.selectionManager.setSelection({
      elements: this._selected,
      editing: false,
    });
  }

  private _drag() {
    if (!this._selected.length || !this.page.root) return;

    this._dragging = true;

    // cache the notes in case it is changed by other peers
    const children = this.page.root.children.slice() as NoteBlockModel[];
    const notes = this._notes;
    const notesMap = this._notes.reduce((map, note, index) => {
      map.set(note.note.id, {
        ...note,
        number: index + 1,
      });
      return map;
    }, new Map<string, TOCNoteItem>());
    const selected = this._selected.slice();

    startDragging({
      container: this,
      doc: this.ownerDocument,
      host: this.host ?? this.ownerDocument,
      page: this.page,
      tocListContainer: this.panelListElement,
      onDragEnd: insertIdx => {
        this._dragging = false;
        this.insertIndex = undefined;

        if (insertIdx === undefined) return;

        this._moveBlocks(insertIdx, selected, notesMap, notes, children);
      },
      onDragMove: (idx, indicatorTranslateY) => {
        this.insertIndex = idx;
        this._indicatorTranslateY = indicatorTranslateY ?? 0;
      },
    });
  }

  /*
   * click at blank area to clear selection
   */
  private _clickBlank = (e: MouseEvent) => {
    e.stopPropagation();
    // check if click at toc-card, if not, set this._selected to empty
    if (
      (e.target as HTMLElement).closest('edgeless-note-toc-card') ||
      this._selected.length === 0
    ) {
      return;
    }

    this._selected = [];
    this.edgeless?.selectionManager.setSelection({
      elements: this._selected,
      editing: false,
    });
  };

  override firstUpdated(): void {
    this._zoomToFit();

    this._disposables.addFromEvent(
      this.tocPanelContainer,
      'click',
      this._clickBlank
    );
  }

  private _zoomToFit() {
    const edgeless = this.edgeless;

    if (!edgeless) return;

    const { surface } = edgeless;
    const bound = edgeless.getElementsBound();

    if (!bound) return;

    this._oldViewport = {
      zoom: surface.viewport.zoom,
      center: {
        x: surface.viewport.center.x,
        y: surface.viewport.center.y,
      },
    };
    surface.viewport.setViewportByBound(
      new Bound(bound.x, bound.y, bound.w, bound.h),
      this.viewportPadding,
      true
    );
  }

  private _fitToElement(e: FitViewEvent) {
    const edgeless = this.edgeless;

    if (!edgeless) return;

    const { block } = e.detail;
    const bound = Bound.deserialize(block.xywh);

    edgeless.surface.viewport.setViewportByBound(
      bound,
      this.viewportPadding,
      true
    );
  }

  private _renderPanelList() {
    const selectedNotesSet = new Set(this._selected);

    return html`<div class="panel-list">
      ${this.insertIndex !== undefined
        ? html`<div
            class="insert-indicator"
            style=${`transform: translateY(${this._indicatorTranslateY}px)`}
          ></div>`
        : nothing}
      ${this._notes.length
        ? repeat(
            this._notes,
            note => note.note.id,
            (note, idx) => html`
              <toc-note-card
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
                .showCardNumber=${this._notes.length > 1}
                .hidePreviewIcon=${this.hidePreviewIcon}
                @select=${this._selectNote}
                @drag=${this._drag}
                @fitview=${this._fitToElement}
              ></toc-note-card>
            `
          )
        : html`${nothing}`}
      ${this._hiddenNotes.length > 0
        ? html`<div class="title">Hidden Contents</div>`
        : nothing}
      ${this._hiddenNotes.length
        ? repeat(
            this._hiddenNotes,
            note => note.note.id,
            (note, idx) =>
              html`<toc-note-card
                  data-note-id=${note.note.id}
                  .note=${note.note}
                  .number=${idx + 1}
                  .index=${note.index}
                  .page=${this.page}
                  .invisible=${true}
                  .showCardNumber=${false}
                  .hidePreviewIcon=${this.hidePreviewIcon}
                  @fitview=${this._fitToElement}
                ></toc-note-card>
                ${idx !== this._hiddenNotes.length - 1
                  ? html`<div class="hidden-note-divider"><div></div></div>`
                  : nothing} `
          )
        : nothing}
    </div>`;
  }

  private _renderEmptyPanel() {
    return html`<div class="no-notes-container">
      <div class="notes-placeholder">
        Use headings to create a table of contents.
      </div>
    </div>`;
  }

  override render() {
    return html`
      <div class="toc-panel-container">
        <toc-note-header
          .hidePreviewIcon=${this.hidePreviewIcon}
          .toggleHidePreviewIcon=${this._toggleHidePreviewIcon}
        ></toc-note-header>
        ${this._notes.length
          ? this._renderPanelList()
          : this._renderEmptyPanel()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'toc-note-panel': TOCNotePanel;
  }
}

const componentsMap = {
  'toc-note-card': TOCNoteCard,
  'toc-block-preview': TOCBlockPreview,
  'toc-note-panel': TOCNotePanel,
  'toc-notes-setting-menu': TOCNotesSettingMenu,
  'toc-note-header': TOCNoteHeader,
};

export function registerTOCPanelComponents(
  callback: (components: typeof componentsMap) => void
) {
  callback(componentsMap);
}
