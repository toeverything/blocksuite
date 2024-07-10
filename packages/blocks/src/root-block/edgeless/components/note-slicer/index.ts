import { WithDisposable } from '@blocksuite/block-std';
import { DisposableGroup } from '@blocksuite/global/utils';
import { css, html, LitElement, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import { SmallScissorsIcon } from '../../../../_common/icons/edgeless.js';
import {
  buildPath,
  getRectByBlockElement,
  Point,
} from '../../../../_common/utils/index.js';
import type {
  EdgelessRootBlockComponent,
  NoteBlockComponent,
  NoteBlockModel,
} from '../../../../index.js';
import {
  deserializeXYWH,
  serializeXYWH,
} from '../../../../surface-block/utils/xywh.js';
import { DEFAULT_NOTE_HEIGHT } from '../../utils/consts.js';

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
  get _editorHost() {
    return this.edgeless.host;
  }

  get _noteBlockElement() {
    if (!this._editorHost) return null;
    const noteBlock = this._editorHost.view.viewFromPath(
      'block',
      buildPath(this.anchorNote)
    );
    return noteBlock ? (noteBlock as NoteBlockComponent) : null;
  }

  get _notePortalElement() {
    return this._noteBlockElement?.closest('.edgeless-block-portal-note');
  }

  get _viewportOffset() {
    const { viewport } = this.edgeless;
    return {
      left: viewport.left ?? 0,
      top: viewport.top ?? 0,
    };
  }

  get _selection() {
    return this.edgeless.service.selection;
  }

  get _zoom() {
    return this.edgeless.service.viewport.zoom;
  }

  static override styles = styles;

  @state()
  private accessor _activeSlicerIndex = 0;

  private _hidden = false;

  private _divingLinePositions: Point[] = [];

  private _noteBlockIds: string[] = [];

  private _noteDisposables: DisposableGroup | null = null;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor anchorNote: NoteBlockModel | null = null;

  private _updateDivingLineAndBlockIds() {
    if (!this.anchorNote || !this._notePortalElement) {
      this._divingLinePositions = [];
      this._noteBlockIds = [];
      return;
    }

    const divingLinePositions: Point[] = [];
    const noteBlockIds: string[] = [];
    const notePortalRect = this._notePortalElement.getBoundingClientRect();
    const notePortalTop = notePortalRect.top;
    const notePortalBottom = notePortalRect.bottom;

    for (let i = 0; i < this.anchorNote.children.length - 1; i++) {
      const child = this.anchorNote.children[i];
      const rect = this.edgeless.host.view
        .viewFromPath('block', buildPath(child))
        ?.getBoundingClientRect();

      if (
        rect &&
        rect.bottom > notePortalTop &&
        rect.bottom < notePortalBottom
      ) {
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

  private _sliceNote() {
    if (!this.anchorNote || !this._noteBlockIds.length) return;
    const doc = this.edgeless.doc;

    const {
      index: originIndex,
      xywh,
      background,
      children,
      displayMode,
    } = this.anchorNote;
    const {
      collapse: _,
      collapsedHeight: __,
      ...restOfEdgeless
    } = this.anchorNote.edgeless;
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

  protected override updated(_changedProperties: PropertyValues) {
    super.updated(_changedProperties);
    if (_changedProperties.has('anchorNote')) {
      this._noteDisposables?.dispose();
      this._noteDisposables = null;
      if (this.anchorNote) {
        this._noteDisposables = new DisposableGroup();
        this._noteDisposables.add(
          this.anchorNote.propsUpdated.on(({ key }) => {
            if (key === 'children' || key === 'xywh') {
              this.requestUpdate();
            }
          })
        );
      }
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();

    if (!this.edgeless.service) return;
    this._updateDivingLineAndBlockIds();
    const { disposables } = this;

    disposables.add(
      this.edgeless.service.uiEventDispatcher.add('pointerMove', ctx => {
        if (this._hidden) this._hidden = false;

        const state = ctx.get('pointerState');
        const pos = new Point(state.x, state.y);
        this._updateActiveSlicerIndex(pos);
      })
    );

    disposables.add(
      this.edgeless.service.viewport.viewportUpdated.on(() => {
        this._hidden = true;
        this.requestUpdate();
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

  override firstUpdated() {
    if (!this.edgeless.service) return;
    this.disposables.add(
      this.edgeless.service.uiEventDispatcher.add('wheel', () => {
        this._hidden = true;
        this.requestUpdate();
      })
    );
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.disposables.dispose();
    this._noteDisposables?.dispose();
    this._noteDisposables = null;
  }

  override render() {
    if (!this.anchorNote || this._hidden) return nothing;
    this._updateDivingLineAndBlockIds();

    const noteBlockElement = this._noteBlockElement;
    if (!noteBlockElement || !this._divingLinePositions.length) return nothing;

    const rect = getRectByBlockElement(noteBlockElement);
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
}

declare global {
  interface HTMLElementTagNameMap {
    'note-slicer': NoteSlicer;
  }
}
