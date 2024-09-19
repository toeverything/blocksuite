import type {
  EdgelessRootBlockComponent,
  NoteBlockModel,
} from '@blocksuite/blocks';
import type { Doc } from '@blocksuite/store';

import { BlocksUtils, NoteDisplayMode } from '@blocksuite/blocks';
import {
  Bound,
  DisposableGroup,
  SignalWatcher,
  WithDisposable,
} from '@blocksuite/global/utils';
import { effect, signal } from '@preact/signals-core';
import { css, html, LitElement, nothing, type PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import type { AffineEditorContainer } from '../../../editors/editor-container.js';
import type {
  ClickBlockEvent,
  DisplayModeChangeEvent,
  FitViewEvent,
  SelectEvent,
} from '../utils/custom-events.js';

import { startDragging } from '../utils/drag.js';
import {
  getHeadingBlocksFromDoc,
  getNotesFromDoc,
  isHeadingBlock,
} from '../utils/query.js';
import {
  observeActiveHeadingDuringScroll,
  scrollToBlockWithHighlight,
} from '../utils/scroll.js';

type OutlineNoteItem = {
  note: NoteBlockModel;

  /**
   * the index of the note inside its parent's children property
   */
  index: number;

  /**
   * the number displayed on the outline panel
   */
  number: number;
};

const styles = css`
  .outline-panel-body-container {
    position: relative;
    display: flex;
    align-items: start;
    box-sizing: border-box;
    flex-direction: column;
    width: 100%;
    height: 100%;
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
`;

export const AFFINE_OUTLINE_PANEL_BODY = 'affine-outline-panel-body';

export class OutlinePanelBody extends SignalWatcher(
  WithDisposable(LitElement)
) {
  static override styles = styles;

  private _activeHeadingId$ = signal<string | null>(null);

  private _changedFlag = false;

  private _clearHighlightMask = () => {};

  private _docDisposables: DisposableGroup | null = null;

  private _indicatorTranslateY = 0;

  private _lockActiveHeadingId = false;

  private _oldViewport?: {
    zoom: number;
    center: {
      x: number;
      y: number;
    };
  };

  get viewportPadding(): [number, number, number, number] {
    return this.fitPadding
      ? ([0, 0, 0, 0].map((val, idx) =>
          Number.isFinite(this.fitPadding[idx]) ? this.fitPadding[idx] : val
        ) as [number, number, number, number])
      : [0, 0, 0, 0];
  }

  private _clearDocDisposables() {
    this._docDisposables?.dispose();
    this._docDisposables = null;
  }

  /*
   * Click at blank area to clear selection
   */
  private _clickHandler(e: MouseEvent) {
    e.stopPropagation();
    // check if click at outline-card, if so, do nothing
    if (
      (e.target as HTMLElement).closest('outline-note-card') ||
      this._selected.length === 0
    ) {
      return;
    }

    this._selected = [];
    this.edgeless?.service.selection.set({
      elements: this._selected,
      editing: false,
    });
  }

  private _deSelectNoteInEdgelessMode(note: NoteBlockModel) {
    if (!this._isEdgelessMode() || !this.edgeless) return;

    const { selection } = this.edgeless.service;
    if (!selection.has(note.id)) return;
    const selectedIds = selection.selectedIds.filter(id => id !== note.id);
    selection.set({
      elements: selectedIds,
      editing: false,
    });
  }

  /*
   * Double click at blank area to disable notes sorting option
   */
  private _doubleClickHandler(e: MouseEvent) {
    e.stopPropagation();
    // check if click at outline-card, if so, do nothing
    if (
      (e.target as HTMLElement).closest('outline-note-card') ||
      !this.enableNotesSorting
    ) {
      return;
    }

    this.toggleNotesSorting();
  }

  private _drag() {
    if (
      !this._selected.length ||
      !this._pageVisibleNotes.length ||
      !this.doc.root
    )
      return;

    this._dragging = true;

    // cache the notes in case it is changed by other peers
    const children = this.doc.root.children.slice() as NoteBlockModel[];
    const notes = this._pageVisibleNotes;
    const notesMap = this._pageVisibleNotes.reduce((map, note, index) => {
      map.set(note.note.id, {
        ...note,
        number: index + 1,
      });
      return map;
    }, new Map<string, OutlineNoteItem>());
    const selected = this._selected.slice();

    startDragging({
      container: this,
      document: this.ownerDocument,
      host: this.domHost ?? this.ownerDocument,
      doc: this.doc,
      outlineListContainer: this.panelListElement,
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

  private _EmptyPanel() {
    return html`<div class="no-note-container">
      <div class="note-placeholder">
        Use headings to create a table of contents.
      </div>
    </div>`;
  }

  private _fitToElement(e: FitViewEvent) {
    const edgeless = this.edgeless;

    if (!edgeless) return;

    const { block } = e.detail;
    const bound = Bound.deserialize(block.xywh);

    edgeless.service.viewport.setViewportByBound(
      bound,
      this.viewportPadding,
      true
    );
  }

  // when display mode change to page only, we should de-select the note if it is selected in edgeless mode
  private _handleDisplayModeChange(e: DisplayModeChangeEvent) {
    const { note, newMode } = e.detail;
    const { displayMode: currentMode } = note;
    if (newMode === currentMode) {
      return;
    }

    this.doc.updateBlock(note, { displayMode: newMode });

    const noteParent = this.doc.getParent(note);
    if (noteParent === null) {
      console.error(`Failed to get parent of note(id:${note.id})`);
      return;
    }

    const noteParentChildNotes = noteParent.children.filter(block =>
      BlocksUtils.matchFlavours(block, ['affine:note'])
    ) as NoteBlockModel[];
    const noteParentLastNote =
      noteParentChildNotes[noteParentChildNotes.length - 1];

    // When the display mode of a note change from edgeless to page visible
    // We should move the note to the end of the note list
    if (
      currentMode === NoteDisplayMode.EdgelessOnly &&
      note !== noteParentLastNote
    ) {
      this.doc.moveBlocks([note], noteParent, noteParentLastNote, false);
    }

    // When the display mode of a note changed to page only
    // We should check if the note is selected in edgeless mode
    // If so, we should de-select it
    if (newMode === NoteDisplayMode.DocOnly) {
      this._deSelectNoteInEdgelessMode(note);
    }
  }

  private _isEdgelessMode() {
    return this.editor.mode === 'edgeless';
  }

  private _moveNotes(
    index: number,
    selected: string[],
    notesMap: Map<string, OutlineNoteItem>,
    notes: OutlineNoteItem[],
    children: NoteBlockModel[]
  ) {
    if (!this._isEdgelessMode() || !children.length || !this.doc.root) return;

    const blocks = selected.map(
      id => (notesMap.get(id) as OutlineNoteItem).note
    );
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
    this.doc.updateBlock(this.doc.root, {
      children: newChildren,
    });
  }

  private _PanelList(withEdgelessOnlyNotes: boolean) {
    const selectedNotesSet = new Set(this._selected);

    return html`<div class="panel-list">
      ${this.insertIndex !== undefined
        ? html`<div
            class="insert-indicator"
            style=${`transform: translateY(${this._indicatorTranslateY}px)`}
          ></div>`
        : nothing}
      ${this._renderDocTitle()}
      ${this._pageVisibleNotes.length
        ? repeat(
            this._pageVisibleNotes,
            note => note.note.id,
            (note, idx) => html`
              <affine-outline-note-card
                data-note-id=${note.note.id}
                .note=${note.note}
                .number=${idx + 1}
                .index=${note.index}
                .doc=${this.doc}
                .editorMode=${this.editor.mode}
                .activeHeadingId=${this._activeHeadingId$.value}
                .status=${selectedNotesSet.has(note.note.id)
                  ? this._dragging
                    ? 'placeholder'
                    : 'selected'
                  : undefined}
                .showPreviewIcon=${this.showPreviewIcon}
                .enableNotesSorting=${this.enableNotesSorting}
                @select=${this._selectNote}
                @drag=${this._drag}
                @fitview=${this._fitToElement}
                @clickblock=${(e: ClickBlockEvent) => {
                  this._scrollToBlock(e.detail.blockId).catch(console.error);
                }}
                @displaymodechange=${this._handleDisplayModeChange}
              ></affine-outline-note-card>
            `
          )
        : html`${nothing}`}
      ${withEdgelessOnlyNotes
        ? html`<div class="hidden-title">Hidden Contents</div>
            ${repeat(
              this._edgelessOnlyNotes,
              note => note.note.id,
              (note, idx) =>
                html`<affine-outline-note-card
                  data-note-id=${note.note.id}
                  .note=${note.note}
                  .number=${idx + 1}
                  .index=${note.index}
                  .doc=${this.doc}
                  .activeHeadingId=${this._activeHeadingId$.value}
                  .invisible=${true}
                  .showPreviewIcon=${this.showPreviewIcon}
                  .enableNotesSorting=${this.enableNotesSorting}
                  @fitview=${this._fitToElement}
                  @displaymodechange=${this._handleDisplayModeChange}
                ></affine-outline-note-card>`
            )} `
        : nothing}
    </div>`;
  }

  private _renderDocTitle() {
    if (!this.doc.root) return nothing;

    const hasNotEmptyHeadings =
      getHeadingBlocksFromDoc(
        this.doc,
        [NoteDisplayMode.DocOnly, NoteDisplayMode.DocAndEdgeless],
        true
      ).length > 0;

    if (!hasNotEmptyHeadings) return nothing;

    return html`<affine-outline-block-preview
      class=${classMap({
        active: this.doc.root.id === this._activeHeadingId$.value,
      })}
      .block=${this.doc.root}
      .className=${this.doc.root?.id === this._activeHeadingId$.value
        ? 'active'
        : ''}
      .cardNumber=${1}
      .enableNotesSorting=${false}
      .showPreviewIcon=${this.showPreviewIcon}
      @click=${() => {
        if (!this.doc.root) return;
        this._scrollToBlock(this.doc.root.id).catch(console.error);
      }}
    ></affine-outline-block-preview>`;
  }

  private async _scrollToBlock(blockId: string) {
    this._lockActiveHeadingId = true;
    this._activeHeadingId$.value = blockId;
    this._clearHighlightMask = await scrollToBlockWithHighlight(
      this.editor,
      blockId
    );
    this._lockActiveHeadingId = false;
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

    // When edgeless mode, should select notes which display in both mode
    const selectedIds = this._pageVisibleNotes.reduce((ids, item) => {
      const note = item.note;
      if (
        this._selected.includes(note.id) &&
        (!note.displayMode ||
          note.displayMode === NoteDisplayMode.DocAndEdgeless)
      ) {
        ids.push(note.id);
      }
      return ids;
    }, [] as string[]);
    this.edgeless?.service.selection.set({
      elements: selectedIds,
      editing: false,
    });
  }

  private _setDocDisposables() {
    this._clearDocDisposables();
    this._docDisposables = new DisposableGroup();
    this._docDisposables.add(
      effect(() => {
        this._updateNotes();
        this._updateNoticeVisibility();
      })
    );
    this._docDisposables.add(
      this.doc.slots.blockUpdated.on(payload => {
        if (
          payload.type === 'update' &&
          payload.flavour === 'affine:note' &&
          payload.props.key === 'displayMode'
        ) {
          this._updateNotes();
        }
      })
    );
  }

  /**
   * There are two cases that we should render note list:
   * 1. There are headings in the notes
   * 2. No headings, but there are blocks in the notes and note sorting option is enabled
   */
  private _shouldRenderNoteList(noteItems: OutlineNoteItem[]) {
    if (!noteItems.length) return false;

    let hasHeadings = false;
    let hasChildrenBlocks = false;

    for (const noteItem of noteItems) {
      for (const block of noteItem.note.children) {
        hasChildrenBlocks = true;

        if (isHeadingBlock(block)) {
          hasHeadings = true;
          break;
        }
      }

      if (hasHeadings) {
        break;
      }
    }

    return hasHeadings || (this.enableNotesSorting && hasChildrenBlocks);
  }

  private _updateNotes() {
    const rootModel = this.doc.root;

    if (this._dragging) return;

    if (!rootModel) {
      this._pageVisibleNotes = [];
      return;
    }

    const oldSelectedSet = this._selected.reduce((pre, id) => {
      pre.add(id);
      return pre;
    }, new Set<string>());
    const newSelected: string[] = [];

    rootModel.children.forEach(block => {
      if (!BlocksUtils.matchFlavours(block, ['affine:note'])) return;

      const blockModel = block as NoteBlockModel;

      if (blockModel.displayMode !== NoteDisplayMode.EdgelessOnly) {
        if (oldSelectedSet.has(block.id)) {
          newSelected.push(block.id);
        }
      }
    });

    this._pageVisibleNotes = getNotesFromDoc(this.doc, [
      NoteDisplayMode.DocAndEdgeless,
      NoteDisplayMode.DocOnly,
    ]);
    this._edgelessOnlyNotes = getNotesFromDoc(this.doc, [
      NoteDisplayMode.EdgelessOnly,
    ]);
    this._selected = newSelected;
  }

  private _updateNoticeVisibility() {
    if (this.enableNotesSorting) {
      if (this.noticeVisible) {
        this.setNoticeVisibility(false);
      }
      return;
    }

    const shouldShowNotice = this._pageVisibleNotes.some(
      note => note.note.displayMode === NoteDisplayMode.DocOnly
    );

    if (shouldShowNotice && !this.noticeVisible) {
      this.setNoticeVisibility(true);
    }
  }

  private _zoomToFit() {
    const edgeless = this.edgeless;

    if (!edgeless) return;

    const bound = edgeless.getElementsBound();

    if (!bound) return;

    this._oldViewport = {
      zoom: edgeless.service.viewport.zoom,
      center: {
        x: edgeless.service.viewport.center.x,
        y: edgeless.service.viewport.center.y,
      },
    };
    edgeless.service.viewport.setViewportByBound(
      new Bound(bound.x, bound.y, bound.w, bound.h),
      this.viewportPadding,
      true
    );
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.disposables.add(
      observeActiveHeadingDuringScroll(
        () => this.editor,
        newHeadingId => {
          if (this._lockActiveHeadingId) return;
          this._activeHeadingId$.value = newHeadingId;
        }
      )
    );
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();

    if (!this._changedFlag && this._oldViewport) {
      const edgeless = this.edgeless;

      if (!edgeless) return;

      edgeless.service.viewport.setViewport(
        this._oldViewport.zoom,
        [this._oldViewport.center.x, this._oldViewport.center.y],
        true
      );
    }

    this._clearDocDisposables();
    this._clearHighlightMask();
  }

  override firstUpdated(): void {
    this.disposables.addFromEvent(this, 'click', this._clickHandler);
    this.disposables.addFromEvent(this, 'dblclick', this._doubleClickHandler);
  }

  override render() {
    const shouldRenderPageVisibleNotes = this._shouldRenderNoteList(
      this._pageVisibleNotes
    );
    const shouldRenderEdgelessOnlyNotes =
      this.renderEdgelessOnlyNotes &&
      this._shouldRenderNoteList(this._edgelessOnlyNotes);

    const shouldRenderEmptyPanel =
      !shouldRenderPageVisibleNotes && !shouldRenderEdgelessOnlyNotes;

    return html`
      <div class="outline-panel-body-container">
        ${shouldRenderEmptyPanel
          ? this._EmptyPanel()
          : this._PanelList(shouldRenderEdgelessOnlyNotes)}
      </div>
    `;
  }

  override willUpdate(_changedProperties: PropertyValues) {
    if (_changedProperties.has('doc') || _changedProperties.has('edgeless')) {
      this._setDocDisposables();
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

  @state()
  private accessor _dragging = false;

  @state()
  private accessor _edgelessOnlyNotes: OutlineNoteItem[] = [];

  @state()
  private accessor _pageVisibleNotes: OutlineNoteItem[] = [];

  /**
   * store the id of selected notes
   */
  @state()
  private accessor _selected: string[] = [];

  @property({ attribute: false })
  accessor doc!: Doc;

  @property({ attribute: false })
  accessor domHost!: Document | HTMLElement;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent | null;

  @property({ attribute: false })
  accessor editor!: AffineEditorContainer;

  @property({ attribute: false })
  accessor enableNotesSorting!: boolean;

  @property({ attribute: false })
  accessor fitPadding!: number[];

  @property({ attribute: false })
  accessor insertIndex: number | undefined = undefined;

  @property({ attribute: false })
  accessor noticeVisible!: boolean;

  @query('.outline-panel-body-container')
  accessor OutlinePanelContainer!: HTMLElement;

  @query('.panel-list')
  accessor panelListElement!: HTMLElement;

  @property({ attribute: false })
  accessor renderEdgelessOnlyNotes: boolean = true;

  @property({ attribute: false })
  accessor setNoticeVisibility!: (visibility: boolean) => void;

  @property({ attribute: false })
  accessor showPreviewIcon!: boolean;

  @property({ attribute: false })
  accessor toggleNotesSorting!: () => void;
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_OUTLINE_PANEL_BODY]: OutlinePanelBody;
  }
}
