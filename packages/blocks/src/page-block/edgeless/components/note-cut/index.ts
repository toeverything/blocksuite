import type { PointerEventState } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/lit';
import { deserializeXYWH, serializeXYWH } from '@blocksuite/phasor';
import type { BaseBlockModel } from '@blocksuite/store';
import { assertExists } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import {
  almostEqual,
  type BlockComponentElement,
  getModelByBlockElement,
  getRectByBlockElement,
  Point,
} from '../../../../__internal__/index.js';
import {
  type EdgelessPageBlockComponent,
  getBlockElementByModel,
  type NoteBlockModel,
} from '../../../../index.js';
import {
  DefaultModeDragType,
  type DefaultToolController,
} from '../../tool-controllers/default-tool.js';
import { DEFAULT_NOTE_HEIGHT } from '../../utils/consts.js';
import { isTopLevelBlock } from '../../utils/query.js';
import { NoteScissorsVisualButton } from './cut-button.js';
import { NoteCutIndicator } from './cut-indicator.js';
import { findClosestBlock } from './utils.js';

NoteScissorsVisualButton;
NoteCutIndicator;

@customElement('affine-note-cut')
export class NoteCut extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: none;
      position: absolute;
      top: 0;
      left: 0;
    }

    .affine-note-cut-container {
      display: flex;
      justify-content: flex-start;
      align-items: center;
    }
  `;

  @property({ attribute: false })
  edgelessPage!: EdgelessPageBlockComponent;

  @query('note-scissors-button')
  private _scissorsButton!: NoteScissorsVisualButton;

  @query('note-cut-indicator')
  private _indicatorLine!: NoteCutIndicator;

  @state()
  private _lastPosition: {
    transformX: number;
    transformY: number;
    width: number;
    gapRect: DOMRect;
  } | null = null;

  private _noteModel: NoteBlockModel | null = null;
  private _blockModel: BaseBlockModel<object> | null = null;

  override connectedCallback(): void {
    super.connectedCallback();

    if (!this.edgelessPage.service) return;

    this._disposables.add(
      this.edgelessPage.service.uiEventDispatcher.add('pointerMove', ctx => {
        const e = ctx.get('pointerState');
        this._updateVisiblity(e);
      })
    );
    this._disposables.add(
      this.edgelessPage.service.uiEventDispatcher.add('wheel', () => {
        this._hide();
      })
    );
  }

  private get selection() {
    return this.edgelessPage.selection;
  }

  private get _notHovering() {
    return (
      this.edgelessPage.edgelessTool.type !== 'default' ||
      (
        this.edgelessPage.service?.selection
          ?.currentController as DefaultToolController
      ).dragType !== DefaultModeDragType.None
    );
  }

  private _updateVisiblity(e: PointerEventState) {
    const block = this.selection.state.selected[0];
    if (this._notHovering || !block || !isTopLevelBlock(block)) {
      this._hide();
      return;
    }

    const editingState = this._getEditingState(e, block);

    if (editingState) {
      this._show(e, editingState);
    } else {
      this._hide();
    }
  }

  private _getEditingState(e: PointerEventState, block: NoteBlockModel) {
    const noteBlockElement = getBlockElementByModel(block);
    assertExists(noteBlockElement);

    const {
      raw: { clientX, clientY },
    } = e;
    const element = findClosestBlock(
      noteBlockElement,
      new Point(clientX, clientY)
    );

    if (!element) return null;

    const elementRect = getRectByBlockElement(element);
    const onUpperPart = clientY <= elementRect.y + elementRect.height / 2;
    const nearbyBlockElement = onUpperPart
      ? element.previousElementSibling
      : element.nextElementSibling;

    if (!nearbyBlockElement) {
      return null;
    }

    const currentBlock = getModelByBlockElement(element);
    const nearbyBlock = getModelByBlockElement(nearbyBlockElement);
    const nearbyBlockRect = nearbyBlockElement.getBoundingClientRect();
    const upperBlockRect = onUpperPart ? nearbyBlockRect : elementRect;
    const lowerBlockRect = onUpperPart ? elementRect : nearbyBlockRect;

    return {
      note: block,
      noteElement: noteBlockElement,
      upperBlock: onUpperPart ? nearbyBlock : currentBlock,
      lowerBlock: onUpperPart ? currentBlock : nearbyBlock,
      gapRect: new DOMRect(
        upperBlockRect.x,
        upperBlockRect.y + upperBlockRect.height,
        upperBlockRect.width,
        lowerBlockRect.y - (upperBlockRect.y + upperBlockRect.height)
      ),
    };
  }

  private _show(
    event: PointerEventState,
    modelState: {
      note: NoteBlockModel;
      noteElement: BlockComponentElement;
      upperBlock: BaseBlockModel<object>;
      lowerBlock: BaseBlockModel<object>;
      gapRect: DOMRect;
    }
  ) {
    const { note, noteElement, upperBlock, gapRect } = modelState;

    if (!noteElement.parentElement) {
      this._hide();
      return;
    }

    const shouldTransition = note === this._noteModel;
    const noteContainer = noteElement.parentElement;
    const [baseX, baseY] = deserializeXYWH(note.xywh);
    const containerRect = noteContainer.getBoundingClientRect();
    const transformX = baseX;
    const transformY =
      baseY +
      (gapRect.top + gapRect.height / 2 + 1 - containerRect.top) /
        this.edgelessPage.surface.viewport.zoom;

    if (this._lastPosition) {
      if (
        !almostEqual(transformX, this._lastPosition.transformX) ||
        !almostEqual(transformY, this._lastPosition.transformY)
      ) {
        this._scissorsButton?.reset();
        this._indicatorLine?.reset();
      } else {
        return;
      }
    }

    this._noteModel = note;
    this._blockModel = upperBlock;
    this._lastPosition = {
      transformX,
      transformY,
      width: noteElement.offsetWidth,
      gapRect,
    };

    requestAnimationFrame(() => {
      if (this.style.display === 'block' && shouldTransition) {
        this.style.transition = 'transform .2s ease-in-out';
      } else {
        this.style.display = 'block';
        this.style.removeProperty('transition');
      }

      this.style.transform = `translate3d(${transformX}px, ${transformY}px, 0) translate3d(0, -50%, 0)`;
      this.style.zIndex = noteContainer.style.zIndex;
    });
  }

  private _hide() {
    this.style.removeProperty('display');
    this._scissorsButton?.reset();
    this._indicatorLine?.reset();
    this._lastPosition = null;
    this._blockModel = null;
    this._noteModel = null;
  }

  private _showIndicator() {
    if (this._lastPosition) {
      this.style.zIndex = (Number(this.style.zIndex) + 1).toString();
      this._indicatorLine?.show();
    }
  }

  private _popupButton() {
    this._scissorsButton.show(this.edgelessPage.surface.viewport.zoom);
  }

  private _clipNote() {
    if (!this._blockModel || !this._noteModel || !this._lastPosition) return;

    const page = this.edgelessPage.page;

    const { index: originIndex, xywh, background, children } = this._noteModel;
    const sliceIndex = children.findIndex(
      block => block.id === this._blockModel?.id
    );
    const resetBlocks = children.slice(sliceIndex + 1);
    const { transformY: y } = this._lastPosition;
    const [x, , width] = deserializeXYWH(xywh);
    const newNoteId = page.addBlock(
      'affine:note',
      {
        background,
        xywh: serializeXYWH(x, y + 30, width, DEFAULT_NOTE_HEIGHT),
        index: originIndex + 1,
      },
      page.root?.id
    );

    page.moveBlocks(
      resetBlocks,
      page.getBlockById(newNoteId) as NoteBlockModel
    );

    this.edgelessPage.slots.selectedBlocksUpdated.emit([]);
    this._hide();
  }

  override render() {
    return html`<div class="affine-note-cut-container">
      <note-scissors-button
        .edgelessPage=${this.edgelessPage}
        @showindicator=${this._showIndicator}
        @mouseenterbutton=${this._popupButton}
        @clip=${this._clipNote}
      ></note-scissors-button>
      <note-cut-indicator
        .width=${this._lastPosition?.width ?? 0}
      ></note-cut-indicator>
    </div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-note-cut': NoteCut;
  }
}
