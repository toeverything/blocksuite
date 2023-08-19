import type { PointerEventState } from '@blocksuite/block-std';
import { almostEqual, assertExists, noop } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { deserializeXYWH, serializeXYWH } from '@blocksuite/phasor';
import type { BaseBlockModel } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { EDGELESS_BLOCK_CHILD_PADDING } from '../../../../__internal__/consts.js';
import {
  type BlockComponentElement,
  getBlockElementByModel,
  getModelByBlockElement,
  getRectByBlockElement,
  Point,
} from '../../../../__internal__/index.js';
import type {
  EdgelessPageBlockComponent,
  NoteBlockModel,
} from '../../../../index.js';
import {
  DefaultModeDragType,
  type DefaultToolController,
} from '../../tool-controllers/default-tool.js';
import { DEFAULT_NOTE_HEIGHT } from '../../utils/consts.js';
import { isTopLevelBlock } from '../../utils/query.js';
import { NoteSlicerButton } from './slicer-button.js';
import { NoteSlicerIndicator } from './slicer-indicator.js';
import { findClosestBlock } from './utils.js';

noop(NoteSlicerButton);
noop(NoteSlicerIndicator);

@customElement('affine-note-slicer')
export class NoteSlicer extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: none;
      position: absolute;
      top: 0;
      left: 0;
    }

    .affine-note-slicer-container {
      display: flex;
      justify-content: flex-start;
      align-items: center;
    }
  `;

  @property({ attribute: false })
  edgelessPage!: EdgelessPageBlockComponent;

  @query('note-slicer-button')
  private _scissorsButton!: NoteSlicerButton;

  @query('note-slicer-indicator')
  private _indicatorLine!: NoteSlicerIndicator;

  @state()
  private _lastPosition: {
    transformX: number;
    transformY: number;
    width: number;
    gapRect: DOMRect;
    sliceVerticalPos: number;
  } | null = null;

  private _noteModel: NoteBlockModel | null = null;
  private _blockModel: BaseBlockModel<object> | null = null;

  override connectedCallback(): void {
    super.connectedCallback();

    if (!this.edgelessPage.service) return;

    this._disposables.add(
      this.edgelessPage.service.uiEventDispatcher.add('pointerMove', ctx => {
        const e = ctx.get('pointerState');
        this._updateVisibility(e);
      })
    );
    this._disposables.add(
      this.edgelessPage.service.uiEventDispatcher.add('wheel', () => {
        this._hide();
      })
    );
  }

  private get selection() {
    return this.edgelessPage.selectionManager;
  }

  private get _notHovering() {
    return (
      this.edgelessPage.edgelessTool.type !== 'default' ||
      (this.edgelessPage.tools.currentController as DefaultToolController)
        .dragType !== DefaultModeDragType.None
    );
  }

  private get _zoom() {
    return this.edgelessPage?.surface?.viewport.zoom ?? 1;
  }

  private _updateVisibility(e: PointerEventState) {
    const block = this.selection.elements[0];

    if (
      this._zoom < 0.4 ||
      this._notHovering ||
      !block ||
      !isTopLevelBlock(block)
    ) {
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
      upperBlockElement: (onUpperPart
        ? nearbyBlockElement
        : element) as HTMLElement,
      gapRect: new DOMRect(
        upperBlockRect.x,
        upperBlockRect.y + upperBlockRect.height,
        upperBlockRect.width,
        lowerBlockRect.y - (upperBlockRect.y + upperBlockRect.height)
      ),
    };
  }

  private _show(
    _event: PointerEventState,
    modelState: {
      note: NoteBlockModel;
      noteElement: BlockComponentElement;
      upperBlock: BaseBlockModel<object>;
      upperBlockElement: HTMLElement;
      gapRect: DOMRect;
    }
  ) {
    const { note, noteElement, upperBlock, upperBlockElement, gapRect } =
      modelState;

    if (!noteElement.parentElement) {
      this._hide();
      return;
    }

    const shouldTransition = note === this._noteModel;
    const noteContainer = noteElement.parentElement;
    const noteContainerRect = noteContainer.getBoundingClientRect();
    const [baseX, baseY] = deserializeXYWH(note.xywh);
    const transformX = baseX * this._zoom;
    const transformY =
      baseY * this._zoom -
      noteContainerRect.top +
      gapRect.top +
      gapRect.height / 2;
    const sliceVerticalPos =
      baseY + upperBlockElement.offsetHeight + upperBlockElement.offsetTop;

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
      width: noteElement.offsetWidth * this._zoom,
      gapRect,
      sliceVerticalPos,
    };

    requestAnimationFrame(() => {
      if (this.style.display === 'block' && shouldTransition) {
        this.style.transition = 'transform .2s ease-in-out';
      } else {
        this.style.display = 'block';
        this.style.removeProperty('transition');
      }

      this.style.transform = `translate3d(calc(var(--affine-edgeless-x) + ${transformX}px), calc(var(--affine-edgeless-y) + ${transformY}px), 0) translate3d(0, -50%, 0)`;
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
    this._scissorsButton.show();
  }

  private _clipNote() {
    if (!this._blockModel || !this._noteModel || !this._lastPosition) return;

    const page = this.edgelessPage.page;

    const { index: originIndex, xywh, background, children } = this._noteModel;
    const sliceIndex = children.findIndex(
      block => block.id === this._blockModel?.id
    );
    const resetBlocks = children.slice(sliceIndex + 1);
    const { sliceVerticalPos } = this._lastPosition;
    const [x, , width] = deserializeXYWH(xywh);
    const newNoteId = page.addBlock(
      'affine:note',
      {
        background,
        xywh: serializeXYWH(
          x,
          sliceVerticalPos + EDGELESS_BLOCK_CHILD_PADDING + 30,
          width,
          DEFAULT_NOTE_HEIGHT
        ),
        index: originIndex + 1,
      },
      page.root?.id
    );

    page.moveBlocks(
      resetBlocks,
      page.getBlockById(newNoteId) as NoteBlockModel
    );

    this.selection.setSelectedBlocks([]);
    this._hide();
  }

  override render() {
    return html`<div class="affine-note-slicer-container">
      <note-slicer-button
        .edgelessPage=${this.edgelessPage}
        @showindicator=${this._showIndicator}
        @popupbutton=${this._popupButton}
        @clip=${this._clipNote}
      ></note-slicer-button>
      <note-slicer-indicator
        .offset=${EDGELESS_BLOCK_CHILD_PADDING * this._zoom - 20}
        .width=${this._lastPosition?.width ?? 0}
      ></note-slicer-indicator>
    </div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-note-slicer': NoteSlicer;
  }
}
