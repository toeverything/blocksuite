import type {
  EdgelessPageBlockComponent,
  NoteBlockModel,
} from '@blocksuite/blocks';
import { Bound } from '@blocksuite/blocks';
import { DisposableGroup, noop } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import { WithDisposable } from '@blocksuite/lit';
import { type Page } from '@blocksuite/store';
import { css, html, LitElement, nothing, type PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  type ClickBlockEvent,
  type FitViewEvent,
  type SelectEvent,
  TOCNoteCard,
} from './toc-card.js';
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

export class TOCPanelBody extends WithDisposable(LitElement) {
  static override styles = css`
    .toc-panel-body-container {
      position: relative;
      display: flex;
      align-items: start;
      box-sizing: border-box;
      flex-direction: column;
      width: 100%;
      position: relative;
      padding: 0 8px;
    }

    .panel-list {
      position: relative;
      width: 100%;
    }

    .panel-list .hidden-title {
      width: 100%;
      font-size: 14px;
      line-height: 24px;
      font-weight: 500;
      color: var(--affine-text-secondary-color);
      padding-left: 8px;
      height: 40px;
      box-sizing: border-box;
      padding: 6px 8px;
      margin-top: 8px;
    }

    .insert-indicator {
      height: 2px;
      border-radius: 1px;
      background-color: var(--affine-brand-color);
      border-radius: 1px;
      position: absolute;
      contain: layout size;
      width: 100%;
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
  edgeless!: EdgelessPageBlockComponent | null;

  @property({ attribute: false })
  editorHost!: EditorHost;

  @property({ attribute: false })
  mode: 'page' | 'edgeless' = 'page';

  @property({ attribute: false })
  insertIndex?: number;

  @property({ attribute: false })
  showPreviewIcon!: boolean;

  @property({ attribute: false })
  enableNotesSorting!: boolean;

  @property({ attribute: false })
  toggleNotesSorting!: () => void;

  /**
   * store the id of selected notes
   */
  @state()
  private _selected: string[] = [];

  @query('.panel-list')
  panelListElement!: HTMLElement;

  @query('.toc-panel-body-container')
  tocPanelContainer!: HTMLElement;

  @property({ attribute: false })
  fitPadding!: number[];

  @property({ attribute: false })
  domHost!: Document | HTMLElement;

  private _pageDisposables: DisposableGroup | null = null;
  private _indicatorTranslateY = 0;
  private _changedFlag = false;
  private _oldViewport?: {
    zoom: number;
    center: {
      x: number;
      y: number;
    };
  };
  private _highlightMask: HTMLDivElement | null = null;
  private _highlightTimeoutId: ReturnType<typeof setTimeout> | null = null;

  get viewportPadding(): [number, number, number, number] {
    return this.fitPadding
      ? ([0, 0, 0, 0].map((val, idx) =>
          Number.isFinite(this.fitPadding[idx]) ? this.fitPadding[idx] : val
        ) as [number, number, number, number])
      : [0, 0, 0, 0];
  }

  private _isEdgelessMode() {
    return this.mode === 'edgeless';
  }

  private _clearHighlightMask() {
    this._highlightMask?.remove();
    this._highlightMask = null;
    if (this._highlightTimeoutId) {
      clearTimeout(this._highlightTimeoutId);
      this._highlightTimeoutId = null;
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
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

    this._clearPageDisposables();
    this._clearHighlightMask();
  }

  private _clearPageDisposables() {
    this._pageDisposables?.dispose();
    this._pageDisposables = null;
  }

  private _setPageDisposables() {
    const { slots, root } = this.page;
    const slotsForUpdate = root
      ? [root.childrenUpdated, slots.blockUpdated]
      : [slots.blockUpdated];

    slots.rootAdded.on(root => {
      this._clearPageDisposables();
      this._pageDisposables = new DisposableGroup();
      this._pageDisposables.add(
        root.childrenUpdated.on(() => this._updateNotes())
      );
    });

    slotsForUpdate.forEach(slot => {
      this._clearPageDisposables();
      this._pageDisposables = new DisposableGroup();
      this._pageDisposables.add(slot.on(() => this._updateNotes()));
    });

    this._updateNotes();
  }

  override updated(_changedProperties: PropertyValues) {
    if (_changedProperties.has('page') || _changedProperties.has('edgeless')) {
      this._setPageDisposables();
    }

    if (
      _changedProperties.has('mode') &&
      this.edgeless &&
      this._isEdgelessMode()
    ) {
      this._clearHighlightMask();
      if (_changedProperties.get('mode') === undefined) return;

      requestAnimationFrame(() => this._zoomToFit());
    }
  }

  private _updateNotes() {
    const root = this.page.root;

    if (this._dragging) return;

    if (!root) {
      this._notes = [];
      return;
    }

    const visibleNotes: TOCPanelBody['_notes'] = [];
    const hiddenNotes: TOCPanelBody['_notes'] = [];
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

  private _moveNotes(
    index: number,
    selected: string[],
    notesMap: Map<string, TOCNoteItem>,
    notes: TOCNoteItem[],
    children: NoteBlockModel[]
  ) {
    if (!this._isEdgelessMode() || !children.length || !this.page.root) return;

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
    this.page.root.childrenUpdated.emit();
  }

  private _selectNote(e: SelectEvent) {
    if (!this._isEdgelessMode()) return;

    const { selected, id, multiselect } = e.detail;

    if (!selected) {
      this._selected = this._selected.filter(noteId => noteId !== id);
    } else if (multiselect) {
      this._selected = [...this._selected, id];
    } else {
      this._selected = [id];
    }

    this.edgeless?.selectionManager.set({
      elements: this._selected,
      editing: false,
    });
  }

  private _drag() {
    if (!this._selected.length || !this._notes.length || !this.page.root)
      return;

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
      host: this.domHost ?? this.ownerDocument,
      page: this.page,
      tocListContainer: this.panelListElement,
      onDragEnd: insertIdx => {
        this._dragging = false;
        this.insertIndex = undefined;

        if (insertIdx === undefined) return;

        this._moveNotes(insertIdx, selected, notesMap, notes, children);
      },
      onDragMove: (idx, indicatorTranslateY) => {
        this.insertIndex = idx;
        this._indicatorTranslateY = indicatorTranslateY ?? 0;
      },
    });
  }

  /*
   * Click at blank area to clear selection
   */
  private _clickHandler(e: MouseEvent) {
    e.stopPropagation();
    // check if click at toc-card, if so, do nothing
    if (
      (e.target as HTMLElement).closest('toc-note-card') ||
      this._selected.length === 0
    ) {
      return;
    }

    this._selected = [];
    this.edgeless?.selectionManager.set({
      elements: this._selected,
      editing: false,
    });
  }

  /*
   * Double click at blank area to disable notes sorting option
   */
  private _doubleClickHandler(e: MouseEvent) {
    e.stopPropagation();
    // check if click at toc-card, if so, do nothing
    if (
      (e.target as HTMLElement).closest('toc-note-card') ||
      !this.enableNotesSorting
    ) {
      return;
    }

    this.toggleNotesSorting();
  }

  override firstUpdated(): void {
    this.disposables.addFromEvent(this, 'click', this._clickHandler);
    this.disposables.addFromEvent(this, 'dblclick', this._doubleClickHandler);
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

  private _scrollToBlock(e: ClickBlockEvent) {
    if (this._isEdgelessMode() || !this.editorHost) return;

    const pageBlock = this.editorHost.querySelector('affine-doc-page');
    if (!pageBlock) return;

    const { blockPath } = e.detail;
    const path = [pageBlock.model.id, ...blockPath];
    const blockElement = this.editorHost.view.viewFromPath('block', path);
    if (!blockElement) return;

    blockElement.scrollIntoView({
      behavior: 'instant',
      block: 'center',
      inline: 'center',
    });

    requestAnimationFrame(() => {
      const blockRect = blockElement.getBoundingClientRect();
      const { top, left, width, height } = blockRect;
      const {
        top: offsetY,
        left: offsetX,
        scrollTop,
        scrollLeft,
      } = pageBlock.viewport;

      if (!this._highlightMask) {
        this._highlightMask = document.createElement('div');
        pageBlock.appendChild(this._highlightMask);
      }

      Object.assign(this._highlightMask.style, {
        position: 'absolute',
        top: `${top - offsetY + scrollTop}px`,
        left: `${left - offsetX + scrollLeft}px`,
        width: `${width}px`,
        height: `${height}px`,
        background: 'var(--affine-hover-color)',
        borderRadius: '4px',
        display: 'block',
      });

      // Clear the previous timeout if it exists
      if (this._highlightTimeoutId !== null) {
        clearTimeout(this._highlightTimeoutId);
      }

      this._highlightTimeoutId = setTimeout(() => {
        if (this._highlightMask) {
          this._highlightMask.style.display = 'none';
        }
      }, 1000);
    });
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
                .editorMode=${this.mode}
                .status=${selectedNotesSet.has(note.note.id)
                  ? this._dragging
                    ? 'placeholder'
                    : 'selected'
                  : undefined}
                .showCardNumber=${this._notes.length > 1}
                .showPreviewIcon=${this.showPreviewIcon}
                .enableNotesSorting=${this.enableNotesSorting}
                @select=${this._selectNote}
                @drag=${this._drag}
                @fitview=${this._fitToElement}
                @clickblock=${this._scrollToBlock}
              ></toc-note-card>
            `
          )
        : html`${nothing}`}
      ${this._hiddenNotes.length > 0
        ? html`<div class="hidden-title">Hidden Contents</div>`
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
                  .showPreviewIcon=${this.showPreviewIcon}
                  .enableNotesSorting=${this.enableNotesSorting}
                  @fitview=${this._fitToElement}
                ></toc-note-card>
                ${idx !== this._hiddenNotes.length - 1 &&
                this.enableNotesSorting
                  ? html`<div class="hidden-note-divider"><div></div></div>`
                  : nothing} `
          )
        : nothing}
    </div>`;
  }

  private _renderEmptyPanel() {
    return html`<div class="no-note-container">
      <div class="note-placeholder">
        Use headings to create a table of contents.
      </div>
    </div>`;
  }

  override render() {
    return html`
      <div class="toc-panel-body-container">
        ${this._notes.length
          ? this._renderPanelList()
          : this._renderEmptyPanel()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'toc-panel-body': TOCPanelBody;
  }
}
