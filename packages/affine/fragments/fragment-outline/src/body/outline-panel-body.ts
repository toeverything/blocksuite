import { changeNoteDisplayMode } from '@blocksuite/affine-block-note';
import { NoteBlockModel, NoteDisplayMode } from '@blocksuite/affine-model';
import { DocModeProvider } from '@blocksuite/affine-shared/services';
import { matchModels } from '@blocksuite/affine-shared/utils';
import { ShadowlessElement, SurfaceSelection } from '@blocksuite/block-std';
import { GfxControllerIdentifier } from '@blocksuite/block-std/gfx';
import { Bound } from '@blocksuite/global/gfx';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/lit';
import type { BlockModel } from '@blocksuite/store';
import { consume } from '@lit/context';
import { effect, signal } from '@preact/signals-core';
import { html, nothing } from 'lit';
import { query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { when } from 'lit/directives/when.js';

import { type TocContext, tocContext } from '../config';
import type {
  ClickBlockEvent,
  DisplayModeChangeEvent,
  FitViewEvent,
  SelectEvent,
} from '../utils/custom-events';
import type { NoteCardEntity, NoteDropPayload } from '../utils/drag';
import {
  getHeadingBlocksFromDoc,
  getNotesFromDoc,
  isHeadingBlock,
} from '../utils/query';
import {
  observeActiveHeadingDuringScroll,
  scrollToBlockWithHighlight,
} from '../utils/scroll';
import * as styles from './outline-panel-body.css';

export const AFFINE_OUTLINE_PANEL_BODY = 'affine-outline-panel-body';

export class OutlinePanelBody extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  private readonly _activeHeadingId$ = signal<string | null>(null);

  private readonly _dragging$ = signal(false);

  private readonly _indicatorTranslateY$ = signal(0);

  private readonly _pageVisibleNotes$ = signal<NoteBlockModel[]>([]);

  private readonly _edgelessOnlyNotes$ = signal<NoteBlockModel[]>([]);

  private readonly _selectedNotes$ = signal<NoteBlockModel[]>([]);

  private _clearHighlightMask = () => {};

  private _lockActiveHeadingId = false;

  private get _shouldRenderEmptyPanel() {
    return (
      this._pageVisibleNotes$.value.length === 0 &&
      this._edgelessOnlyNotes$.value.length === 0
    );
  }

  private get editor() {
    return this._context.editor$.value;
  }

  private get doc() {
    return this.editor.doc;
  }

  get viewportPadding(): [number, number, number, number] {
    const fitPadding = this._context.fitPadding$.value;
    return fitPadding.length === 4
      ? ([0, 0, 0, 0].map((val, idx) =>
          Number.isFinite(fitPadding[idx]) ? fitPadding[idx] : val
        ) as [number, number, number, number])
      : [0, 0, 0, 0];
  }

  private _deSelectNoteInEdgelessMode(note: NoteBlockModel) {
    const gfx = this.editor.std.get(GfxControllerIdentifier);
    const selection = gfx.selection;

    if (!selection.has(note.id)) return;
    const selectedIds = selection.selectedIds.filter(id => id !== note.id);
    selection.set({
      elements: selectedIds,
      editing: false,
    });
  }

  private _renderEmptyPanel() {
    return html`<div class=${styles.emptyPanel}>
      <div
        data-testid="empty-panel-placeholder"
        class=${styles.emptyPanelPlaceholder}
      >
        Use headings to create a table of contents.
      </div>
    </div>`;
  }

  private _fitToElement(e: FitViewEvent) {
    const gfx = this.editor.std.get(GfxControllerIdentifier);

    const { block } = e.detail;
    const bound = Bound.deserialize(block.xywh);

    gfx.viewport.setViewportByBound(bound, this.viewportPadding, true);
  }

  // when display mode change to page only, we should de-select the note if it is selected in edgeless mode
  private _handleDisplayModeChange(e: DisplayModeChangeEvent) {
    const { note, newMode } = e.detail;
    this.editor.std.command.exec(changeNoteDisplayMode, {
      noteId: note.id,
      mode: newMode,
      stopCapture: true,
    });

    // When the display mode of a note changed to page only
    // We should check if the note is selected in edgeless mode
    // If so, we should de-select it
    if (newMode === NoteDisplayMode.DocOnly) {
      this._deSelectNoteInEdgelessMode(note);
    }
  }

  private _moveSelectedNotes(insertIndex: number) {
    if (!this.doc.root) return;

    const pageVisibleNotes = this._pageVisibleNotes$.peek();
    const selected = this._selectedNotes$.peek();
    const children = this.doc.root.children.slice();

    const noteIndex = new Map<NoteBlockModel, number>();
    children.forEach((block, index) => {
      if (matchModels(block, [NoteBlockModel])) {
        noteIndex.set(block, index);
      }
    });

    let targetIndex: number | null = null;
    if (insertIndex === pageVisibleNotes.length) {
      const temp = noteIndex.get(pageVisibleNotes[insertIndex - 1]);
      if (temp) targetIndex = temp + 1;
    } else {
      targetIndex = noteIndex.get(pageVisibleNotes[insertIndex]) ?? null;
    }

    if (targetIndex === null) return;

    const removeSelectedNoteFilter = (block: BlockModel) =>
      !matchModels(block, [NoteBlockModel]) || !selected.includes(block);

    const leftPart = children
      .slice(0, targetIndex)
      .filter(removeSelectedNoteFilter);
    const rightPart = children
      .slice(targetIndex)
      .filter(removeSelectedNoteFilter);

    const newChildren = [...leftPart, ...selected, ...rightPart];

    this.doc.updateBlock(this.doc.root, {
      children: newChildren,
    });
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
    const { selected, id, multiselect } = e.detail;
    const gfx = this.editor.std.get(GfxControllerIdentifier);
    const editorMode = this.editor.std.get(DocModeProvider).getEditorMode();
    const note = this.doc.getBlock(id)?.model;
    if (!note || !matchModels(note, [NoteBlockModel])) return;

    let selectedNotes = this._selectedNotes$.peek();

    if (!selected) {
      selectedNotes = selectedNotes.filter(_note => _note !== note);
    } else if (multiselect) {
      selectedNotes = [...selectedNotes, note];
    } else {
      selectedNotes = [note];
    }

    if (editorMode === 'edgeless') {
      gfx.selection.set({
        elements: selectedNotes.map(({ id }) => id),
        editing: false,
      });
    } else {
      this._selectedNotes$.value = selectedNotes;
    }
  }

  private _watchSelectedNotes() {
    return effect(() => {
      const { std, doc } = this.editor;
      const docModeService = this.editor.std.get(DocModeProvider);
      const mode = docModeService.getEditorMode();
      if (mode !== 'edgeless') return;

      const currSelectedNotes = std.selection
        .filter(SurfaceSelection)
        .map(({ blockId }) => doc.getBlock(blockId)?.model)
        .filter(model => {
          return !!model && matchModels(model, [NoteBlockModel]);
        });

      const preSelected = this._selectedNotes$.peek();
      if (
        preSelected.length !== currSelectedNotes.length ||
        preSelected.some(note => !currSelectedNotes.includes(note))
      ) {
        this._selectedNotes$.value = currSelectedNotes;
      }
    });
  }

  private _watchNotes() {
    this.disposables.add(
      effect(() => {
        const isRenderableNote = (note: NoteBlockModel) => {
          let hasHeadings = false;

          for (const block of note.children) {
            if (isHeadingBlock(block)) {
              hasHeadings = true;
              break;
            }
          }
          return hasHeadings || this._context.enableSorting$.value;
        };

        this._pageVisibleNotes$.value = getNotesFromDoc(this.doc, [
          NoteDisplayMode.DocAndEdgeless,
          NoteDisplayMode.DocOnly,
        ]).filter(isRenderableNote);

        this._edgelessOnlyNotes$.value = getNotesFromDoc(this.doc, [
          NoteDisplayMode.EdgelessOnly,
        ]).filter(isRenderableNote);
      })
    );
  }

  private _watchDragAndDrop() {
    const std = this.editor.std;
    this.disposables.add(
      std.dnd.monitor<NoteCardEntity, NoteDropPayload>({
        onDragStart: () => {
          this._dragging$.value = true;
          this._selectedNotes$.value = this._selectedNotes$
            .peek()
            .filter(note => {
              return this._pageVisibleNotes$.value.includes(note);
            });
        },
        onDrag: data => {
          const target = data.location.current.dropTargets[0];
          if (!target) return;
          const edge = target.data.edge;
          const rect = target.element.getBoundingClientRect();
          const parentRect = this._pageVisibleList.getBoundingClientRect();
          this._indicatorTranslateY$.value =
            edge === 'top'
              ? rect.top - parentRect.top
              : rect.bottom - parentRect.top;
        },
        onDrop: data => {
          this._dragging$.value = false;
          const target = data.location.current.dropTargets[0];
          if (!target) return;

          const edge = target.data.edge;
          const index = this._pageVisibleNotes$
            .peek()
            .findIndex(({ id }) => id === target.data.noteId);

          if (index === -1) return;

          this._moveSelectedNotes(edge === 'top' ? index : index + 1);
        },
      })
    );
    this.disposables.add(
      std.dnd.autoScroll<NoteCardEntity>({
        element: this,
      })
    );
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.classList.add(styles.outlinePanelBody);

    this.disposables.add(
      observeActiveHeadingDuringScroll(
        () => this.editor,
        newHeadingId => {
          if (this._lockActiveHeadingId) return;
          this._activeHeadingId$.value = newHeadingId;
        }
      )
    );
    this._watchNotes();
    this._watchSelectedNotes();
    this._watchDragAndDrop();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._clearHighlightMask();
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

    const rootId = this.doc.root.id;
    const active = rootId === this._activeHeadingId$.value;

    return html`<affine-outline-block-preview
      class=${classMap({ active: active })}
      .block=${this.doc.root}
      @click=${() => {
        this._scrollToBlock(rootId).catch(console.error);
      }}
    ></affine-outline-block-preview>`;
  }

  private _renderNoteCards(notes: NoteBlockModel[]) {
    return repeat(
      notes,
      ({ id }) => id,
      (note, index) =>
        html`<affine-outline-note-card
          data-note-id=${note.id}
          index=${index}
          .note=${note}
          .activeHeadingId=${this._activeHeadingId$.value}
          .status=${this._selectedNotes$.value.includes(note)
            ? this._dragging$.value
              ? 'dragging'
              : 'selected'
            : 'normal'}
          @fitview=${this._fitToElement}
          @select=${this._selectNote}
          @displaymodechange=${this._handleDisplayModeChange}
          @clickblock=${(e: ClickBlockEvent) => {
            this._scrollToBlock(e.detail.blockId).catch(console.error);
          }}
        ></affine-outline-note-card>`
    );
  }

  private _renderPageVisibleCardList() {
    return html`<div class=${`page-visible-card-list ${styles.cardList}`}>
      ${when(
        this._dragging$.value,
        () =>
          html`<div
            class=${styles.insertIndicator}
            style=${`transform: translateY(${this._indicatorTranslateY$.value}px)`}
          ></div>`
      )}
      ${this._renderNoteCards(this._pageVisibleNotes$.value)}
    </div>`;
  }

  private _renderEdgelessOnlyCardList() {
    const items = this._edgelessOnlyNotes$.value;
    return html`<div class=${styles.cardList}>
      ${when(
        items.length > 0,
        () =>
          html`<div class=${styles.edgelessCardListTitle}>Hidden Contents</div>`
      )}
      ${this._renderNoteCards(items)}
    </div>`;
  }

  override render() {
    return html`
      ${this._renderDocTitle()}
      ${when(
        this._shouldRenderEmptyPanel,
        () => this._renderEmptyPanel(),
        () => html`
          ${this._renderPageVisibleCardList()}
          ${this._renderEdgelessOnlyCardList()}
        `
      )}
    `;
  }

  @query('.page-visible-card-list')
  private accessor _pageVisibleList!: HTMLElement;

  @consume({ context: tocContext })
  private accessor _context!: TocContext;
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_OUTLINE_PANEL_BODY]: OutlinePanelBody;
  }
}
