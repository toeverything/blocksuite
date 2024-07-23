import { WithDisposable } from '@blocksuite/block-std';
import { deserializeXYWH, serializeXYWH } from '@blocksuite/global/utils';
import { Point } from '@blocksuite/global/utils';
import { DisposableGroup } from '@blocksuite/global/utils';
import { LitElement, type PropertyValues, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import type {
  EdgelessRootBlockComponent,
  NoteBlockComponent,
  NoteBlockModel,
} from '../../../../index.js';

import { SmallScissorsIcon } from '../../../../_common/icons/edgeless.js';
import {
  buildPath,
  getRectByBlockComponent,
} from '../../../../_common/utils/index.js';
import { DEFAULT_NOTE_HEIGHT } from '../../utils/consts.js';
import { isNoteBlock } from '../../utils/query.js';

const DIVIDING_LINE_OFFSET = 4;
const NEW_NOTE_GAP = 40;

const styles = css`
  :host {
    display: flex;
  }

  .note-slicer-container {
    display: flex;
  }

  .note-slicer-button {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    box-sizing: border-box;
    border-radius: 4px;
    justify-content: center;
    align-items: center;
    color: var(--affine-icon-color);
    border: 1px solid var(--affine-border-color);
    background-color: var(--affine-background-overlay-panel-color);
    box-shadow: var(--affine-menu-shadow);
    cursor: pointer;
    width: 24px;
    height: 24px;
    transform-origin: left top;
    z-index: var(--affine-z-index-popover);
    opacity: 0;
    transition: opacity 150ms cubic-bezier(0.25, 0.1, 0.25, 1);
  }

  .note-slicer-dividing-line-container {
    display: flex;
    align-items: center;
    position: absolute;
    left: 0;
    top: 0;
    height: 4px;
    cursor: pointer;
  }

  .note-slicer-dividing-line {
    display: block;
    height: 1px;
    width: 100%;
    z-index: var(--affine-z-index-popover);
    background-image: linear-gradient(
      to right,
      var(--affine-black-10) 50%,
      transparent 50%
    );
    background-size: 4px 100%;
  }
  .note-slicer-dividing-line-container.active .note-slicer-dividing-line {
    background-image: linear-gradient(
      to right,
      var(--affine-black-60) 50%,
      transparent 50%
    );
    animation: slide 0.3s linear infinite;
  }
  @keyframes slide {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: -4px 0;
    }
  }
`;
@customElement('note-slicer')
export class NoteSlicer extends WithDisposable(LitElement) {
  private _divingLinePositions: Point[] = [];

  private _hidden = false;

  private _noteBlockIds: string[] = [];

  private _noteDisposables: DisposableGroup | null = null;

  static override styles = styles;

  get _editorHost() {
    return this.edgeless.host;
  }

  get _noteBlock() {
    if (!this._editorHost) return null;
    const noteBlock = this._editorHost.view.viewFromPath(
      'block',
      buildPath(this._anchorNote)
    );
    return noteBlock ? (noteBlock as NoteBlockComponent) : null;
  }

  get _selection() {
    return this.edgeless.service.selection;
  }

  private _sliceNote() {
    if (!this._anchorNote || !this._noteBlockIds.length) return;
    const doc = this.edgeless.doc;

    const {
      index: originIndex,
      xywh,
      background,
      children,
      displayMode,
    } = this._anchorNote;
    const {
      collapse: _,
      collapsedHeight: __,
      ...restOfEdgeless
    } = this._anchorNote.edgeless;
    const anchorBlockId = this._noteBlockIds[this._activeSlicerIndex];
    if (!anchorBlockId) return;
    const sliceIndex = children.findIndex(block => block.id === anchorBlockId);
    const resetBlocks = children.slice(sliceIndex + 1);
    const [x, , width] = deserializeXYWH(xywh);
    const sliceVerticalPos =
      this._divingLinePositions[this._activeSlicerIndex].y;
    const newY = this.edgeless.service.viewport.toModelCoord(
      x,
      sliceVerticalPos
    )[1];
    const newNoteId = this.edgeless.service.addBlock(
      'affine:note',
      {
        background,
        displayMode,
        xywh: serializeXYWH(x, newY + NEW_NOTE_GAP, width, DEFAULT_NOTE_HEIGHT),
        index: originIndex + 1,
        edgeless: restOfEdgeless,
      },
      doc.root?.id
    );

    doc.moveBlocks(resetBlocks, doc.getBlockById(newNoteId) as NoteBlockModel);

    this._activeSlicerIndex = 0;
    this._selection.set({
      elements: [newNoteId],
      editing: false,
    });
  }

  private _updateActiveSlicerIndex(pos: Point) {
    const { _divingLinePositions } = this;
    const curY = pos.y + DIVIDING_LINE_OFFSET * this._zoom;
    let index = -1;
    for (let i = 0; i < _divingLinePositions.length; i++) {
      const currentY = _divingLinePositions[i].y;
      const previousY = i > 0 ? _divingLinePositions[i - 1].y : 0;
      const midY = (currentY + previousY) / 2;
      if (curY < midY) {
        break;
      }
      index++;
    }

    if (index < 0) index = 0;
    this._activeSlicerIndex = index;
  }

  private _updateDivingLineAndBlockIds() {
    if (!this._anchorNote || !this._noteBlock) {
      this._divingLinePositions = [];
      this._noteBlockIds = [];
      return;
    }

    const divingLinePositions: Point[] = [];
    const noteBlockIds: string[] = [];
    const noteRect = this._noteBlock.getBoundingClientRect();
    const noteTop = noteRect.top;
    const noteBottom = noteRect.bottom;

    for (let i = 0; i < this._anchorNote.children.length - 1; i++) {
      const child = this._anchorNote.children[i];
      const rect = this.edgeless.host.view
        .viewFromPath('block', buildPath(child))
        ?.getBoundingClientRect();

      if (rect && rect.bottom > noteTop && rect.bottom < noteBottom) {
        const x = rect.x - this._viewportOffset.left;
        const y =
          rect.bottom +
          DIVIDING_LINE_OFFSET * this._zoom -
          this._viewportOffset.top;
        divingLinePositions.push(new Point(x, y));
        noteBlockIds.push(child.id);
      }
    }

    this._divingLinePositions = divingLinePositions;
    this._noteBlockIds = noteBlockIds;
  }

  private _updateSlicedNote() {
    const { edgeless } = this;
    const { selectedElements } = edgeless.service.selection;

    if (
      !edgeless.service.selection.editing &&
      selectedElements.length === 1 &&
      isNoteBlock(selectedElements[0])
    ) {
      this._anchorNote = selectedElements[0];
    } else {
      this._anchorNote = null;
    }
  }

  get _viewportOffset() {
    const { viewport } = this.edgeless;
    return {
      left: viewport.left ?? 0,
      top: viewport.top ?? 0,
    };
  }

  get _zoom() {
    if (!this.edgeless.service?.viewport) {
      console.error('Viewport is not found, something went wrong.');
      return 1;
    }
    return this.edgeless.service.viewport.zoom;
  }

  override connectedCallback(): void {
    super.connectedCallback();

    const { disposables, edgeless } = this;

    if (!edgeless.service) return;

    this._updateDivingLineAndBlockIds();

    disposables.add(
      edgeless.service.uiEventDispatcher.add('pointerMove', ctx => {
        if (this._hidden) this._hidden = false;

        const state = ctx.get('pointerState');
        const pos = new Point(state.x, state.y);
        this._updateActiveSlicerIndex(pos);
      })
    );

    disposables.add(
      edgeless.service.viewport.viewportUpdated.on(() => {
        this._hidden = true;
        this.requestUpdate();
      })
    );

    disposables.add(
      edgeless.service.selection.slots.updated.on(() => {
        this._enableNoteSlicer = false;
        this._updateSlicedNote();

        if (this.selectedRectEle) {
          this.selectedRectEle.autoCompleteOff = false;
        }
      })
    );

    disposables.add(
      edgeless.slots.toggleNoteSlicer.on(() => {
        this._enableNoteSlicer = !this._enableNoteSlicer;

        if (this.selectedRectEle && this._enableNoteSlicer) {
          this.selectedRectEle.autoCompleteOff = true;
        }
      })
    );

    const { surface } = this.edgeless;
    requestAnimationFrame(() => {
      if (surface.isConnected && surface.edgeless.dispatcher) {
        disposables.add(
          surface.edgeless.dispatcher.add('click', ctx => {
            const event = ctx.get('pointerState');
            const { raw } = event;
            const target = raw.target as HTMLElement;
            if (!target) return false;
            if (target.closest('note-slicer')) {
              this._sliceNote();
              return true;
            }
            return false;
          })
        );
      }
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.disposables.dispose();
    this._noteDisposables?.dispose();
    this._noteDisposables = null;
  }

  override firstUpdated() {
    if (!this.edgeless.service) return;
    this.disposables.add(
      this.edgeless.service.uiEventDispatcher.add('wheel', () => {
        this._hidden = true;
        this.requestUpdate();
      })
    );
  }

  override render() {
    if (
      this.edgeless.doc.readonly ||
      this._hidden ||
      !this._anchorNote ||
      !this._enableNoteSlicer
    ) {
      return nothing;
    }

    this._updateDivingLineAndBlockIds();

    const noteBlock = this._noteBlock;
    if (!noteBlock || !this._divingLinePositions.length) return nothing;

    const rect = getRectByBlockComponent(noteBlock);
    const width = rect.width;
    const buttonPosition = this._divingLinePositions[this._activeSlicerIndex];

    return html`<div class="note-slicer-container">
      <div
        class="note-slicer-button"
        style=${styleMap({
          left: `${buttonPosition.x - 66 * this._zoom}px`,
          top: `${buttonPosition.y}px`,
          opacity: 1,
          scale: `${this._zoom}`,
          transform: 'translateY(-50%)',
        })}
      >
        ${SmallScissorsIcon}
      </div>
      ${this._divingLinePositions.map((pos, idx) => {
        const dividingLineClasses = classMap({
          'note-slicer-dividing-line-container': true,
          active: idx === this._activeSlicerIndex,
        });
        return html`<div
          class=${dividingLineClasses}
          style=${styleMap({
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            width: `${width}px`,
          })}
        >
          <span class="note-slicer-dividing-line"></span>
        </div>`;
      })}
    </div> `;
  }

  protected override updated(_changedProperties: PropertyValues) {
    super.updated(_changedProperties);
    if (_changedProperties.has('anchorNote')) {
      this._noteDisposables?.dispose();
      this._noteDisposables = null;
      if (this._anchorNote) {
        this._noteDisposables = new DisposableGroup();
        this._noteDisposables.add(
          this._anchorNote.propsUpdated.on(({ key }) => {
            if (key === 'children' || key === 'xywh') {
              this.requestUpdate();
            }
          })
        );
      }
    }
  }

  get selectedRectEle() {
    return this.edgeless.querySelector('edgeless-selected-rect');
  }

  @state()
  private accessor _activeSlicerIndex = 0;

  @state()
  private accessor _anchorNote: NoteBlockModel | null = null;

  @state()
  private accessor _enableNoteSlicer = false;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;
}

declare global {
  interface HTMLElementTagNameMap {
    'note-slicer': NoteSlicer;
  }
}
