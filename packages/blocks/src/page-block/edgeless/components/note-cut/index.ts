import type { PointerEventState } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/lit';
import { deserializeXYWH } from '@blocksuite/phasor/index.js';
import type { BaseBlockModel } from '@blocksuite/store/index.js';
import { assertExists } from '@blocksuite/store/index.js';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import {
  type BlockComponentElement,
  getClosestBlockElementByPoint,
  getModelByBlockElement,
  getRectByBlockElement,
  Point,
  Rect,
} from '../../../../__internal__/index.js';
import {
  type EdgelessPageBlockComponent,
  getBlockElementByModel,
  type NoteBlockModel,
} from '../../../../index.js';
import { isTopLevelBlock } from '../../utils/query.js';
import { NoteScissorsVisualButton } from './cut-button.js';
import { NoteCutHint } from './cut-hint.js';

NoteScissorsVisualButton;
NoteCutHint;

@customElement('affine-note-cut')
export class NoteCut extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: none;
      position: absolute;
      top: 0;
      left: 0;
    }

    .cut-hint {
      background-color: var(--affine-blue-500);
    }
  `;

  @property({ attribute: false })
  edgelessPage!: EdgelessPageBlockComponent;

  @query('note-scissors-button')
  button!: NoteScissorsVisualButton;

  private _hintLine: NoteCutHint | null = null;

  private _lastRect: {
    x: number;
    y: number;
    blockRect: DOMRect | null;
  } = {
    x: 0,
    y: 0,
    blockRect: null,
  };

  protected override firstUpdated(): void {
    if (!this._hintLine) {
      this._createHintLine();
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();

    if (!this.edgelessPage.service) return;

    this._disposables.add(
      this.edgelessPage.service.uiEventDispatcher.add('pointerMove', ctx => {
        const e = ctx.get('pointerState');
        this._updateVisiblity(e);
      })
    );
  }

  private get selection() {
    return this.edgelessPage.selection;
  }

  private _createHintLine() {
    this._hintLine = document.createElement('affine-note-cut-hintline');

    document.body.appendChild(this._hintLine);
    this._disposables.add(() => {
      if (!this._hintLine) return;

      document.body.removeChild(this._hintLine);
      this._hintLine = null;
    });
  }

  private _updateVisiblity(e: PointerEventState) {
    const block = this.selection.state.selected[0];
    if (!block || !isTopLevelBlock(block)) {
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
    const noteRect = Rect.fromDOM(noteBlockElement);
    const element = getClosestBlockElementByPoint(
      new Point(clientX, clientY),
      {
        container: noteBlockElement,
        rect: noteRect,
      },
      this.edgelessPage.surface.viewport.zoom
    );

    return element
      ? {
          note: block,
          noteElement: noteBlockElement,
          block: getModelByBlockElement(element),
          blockElement: element as BlockComponentElement,
          blockRect: getRectByBlockElement(element),
        }
      : null;
  }

  private _show(
    event: PointerEventState,
    modelState: {
      note: NoteBlockModel;
      noteElement: BlockComponentElement;
      block: BaseBlockModel<object>;
      blockElement: BlockComponentElement;
      blockRect: DOMRect;
    }
  ) {
    const { note, noteElement, blockRect } = modelState;

    if (!noteElement.parentElement) {
      this._hide();
      return;
    }

    const noteContainer = noteElement.parentElement;
    const [baseX, baseY] = deserializeXYWH(note.xywh);
    const containerRect = noteContainer.getBoundingClientRect();
    const transformX = baseX;
    const transformY =
      baseY +
      (blockRect.top - containerRect.top) /
        this.edgelessPage.surface.viewport.zoom;

    if (
      this.style.display &&
      (transformX !== this._lastRect.x || transformY !== this._lastRect.y)
    ) {
      this.button.reset();
      this._hintLine?.reset();
    }

    this._lastRect = {
      x: transformX,
      y: transformY,
      blockRect,
    };

    this.style.transform = `translate3d(${transformX}px, ${transformY}px, 0)`;
    this.style.display = 'block';
    this.style.zIndex = noteContainer.style.zIndex;
  }

  private _hide() {
    this.style.removeProperty('display');
    this.button.reset();
    this._hintLine?.reset();
    this._lastRect = {
      x: 0,
      y: 0,
      blockRect: null,
    };
  }

  private _showHint() {
    if (this._lastRect.blockRect) {
      this._hintLine?.show(
        this._lastRect.blockRect,
        this.edgelessPage.surface.viewport.zoom
      );
    }
  }

  override render() {
    return html`<div class="affine-note-cut-container">
      <note-scissors-button
        .edgelessPage=${this.edgelessPage}
        @showhint=${this._showHint}
      ></note-scissors-button>
    </div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-note-cut': NoteCut;
  }
}
