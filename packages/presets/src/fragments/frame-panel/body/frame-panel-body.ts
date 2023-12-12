import '../card/frame-card.js';

import {
  Bound,
  EdgelessBlockType,
  type EdgelessPageBlockComponent,
  type FrameBlockModel,
  generateKeyBetween,
  saveViewportToSession,
} from '@blocksuite/blocks';
import { DisposableGroup } from '@blocksuite/global/utils';
import { type EditorHost, WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement, nothing, type PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';

import type {
  DragEvent,
  FitViewEvent,
  FrameCard,
  SelectEvent,
} from '../card/frame-card.js';
import { startDragging } from '../utils/drag.js';

type FrameListItem = {
  frame: FrameBlockModel;

  // frame index
  frameIndex: string;

  // card index
  cardIndex: number;
};

const { FRAME } = EdgelessBlockType;

const styles = css`
  .frame-list-container {
    display: flex;
    align-items: start;
    box-sizing: border-box;
    flex-direction: column;
    width: 100%;
    gap: 16px;
    position: relative;
    margin-left: 8px;
  }

  .no-frame-container {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .no-frame-placeholder {
    margin-top: 240px;
    align-self: center;
    width: 230px;
    height: 48px;
    color: var(--affine-text-secondary-color, #8e8d91);
    text-align: center;

    /* light/base */
    font-size: 15px;
    font-style: normal;
    font-weight: 400;
    line-height: 24px;
  }

  .insert-indicator {
    height: 2px;
    border-radius: 1px;
    background-color: var(--affine-blue-600);
    position: absolute;
    contain: layout size;
    width: 284px;
    left: 0;
  }
`;

export class FramePanelBody extends WithDisposable(LitElement) {
  static override styles = styles;

  @property({ attribute: false })
  edgeless: EdgelessPageBlockComponent | null = null;

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  root!: EditorHost;

  @property({ attribute: false })
  changeEditorMode!: (mode: 'page' | 'edgeless') => void;

  // Store the ids of the selected frames
  @state()
  private _selected: string[] = [];

  @state()
  private _dragging = false;

  @property({ attribute: false })
  insertIndex?: number;

  @property({ attribute: false })
  fitPadding!: number[];

  @property({ attribute: false })
  host!: Document | HTMLElement;

  @query('.frame-list-container')
  frameListContainer!: HTMLElement;

  private _frameItems: FrameListItem[] = [];
  private _frameElementHeight = 0;
  private _indicatorTranslateY = 0;
  private _pageDisposables: DisposableGroup | null = null;

  get frames() {
    const frames = this.page.getBlockByFlavour(FRAME) as FrameBlockModel[];
    return frames.sort(this.compare);
  }

  get viewportPadding(): [number, number, number, number] {
    return this.fitPadding
      ? ([0, 0, 0, 0].map((val, idx) =>
          Number.isFinite(this.fitPadding[idx]) ? this.fitPadding[idx] : val
        ) as [number, number, number, number])
      : [0, 0, 0, 0];
  }

  compare(a: FrameBlockModel, b: FrameBlockModel) {
    if (a.index < b.index) return -1;
    else if (a.index > b.index) return 1;
    return 0;
  }

  private _clearPageDisposables = () => {
    this._pageDisposables?.dispose();
    this._pageDisposables = null;
  };

  private _setPageDisposables(page: Page) {
    this._clearPageDisposables();
    this._pageDisposables = new DisposableGroup();
    this._pageDisposables.add(
      page.slots.blockUpdated.on(({ flavour }) => {
        if (flavour === FRAME) {
          requestAnimationFrame(() => {
            this._updateFrames();
          });
        }
      })
    );
  }

  private _updateFrames() {
    if (this._dragging) return;

    if (!this.frames.length) {
      this._selected = [];
      this._frameItems = [];
      return;
    }

    const frameItems: FramePanelBody['_frameItems'] = [];
    const oldSelectedSet = new Set(this._selected);
    const newSelected: string[] = [];
    const frames = this.frames.sort(this.compare);
    frames.forEach((frame, idx) => {
      const frameItem = {
        frame,
        frameIndex: frame.index,
        cardIndex: idx,
      };

      frameItems.push(frameItem);
      if (oldSelectedSet.has(frame.id)) {
        newSelected.push(frame.id);
      }
    });

    this._frameItems = frameItems;
    this._selected = newSelected;
    this.requestUpdate();
  }

  private _reorderFrames(
    selected: string[],
    framesMap: Map<string, FrameListItem>,
    insertIndex: number
  ) {
    if (insertIndex >= 0 && insertIndex <= this._frameItems.length) {
      const frames = Array.from(framesMap.values()).map(
        frameItem => frameItem.frame
      );
      const selectedFrames = selected
        .map(id => framesMap.get(id) as FrameListItem)
        .map(frameItem => frameItem.frame)
        .sort(this.compare);

      // update selected frames index
      // make the indexes larger than the frame before and smaller than the frame after
      let before = frames[insertIndex - 1]?.index || null;
      const after = frames[insertIndex]?.index || null;
      selectedFrames.forEach(frame => {
        const newIndex = generateKeyBetween(before, after);
        frame.page.updateBlock(frame, {
          index: newIndex,
        });
        before = newIndex;
      });

      this.page.captureSync();
      this._updateFrames();
    }
  }

  private _selectFrame = (e: SelectEvent) => {
    const { selected, id, multiselect } = e.detail;

    if (!selected) {
      // de-select frame
      this._selected = this._selected.filter(frameId => frameId !== id);
    } else if (multiselect) {
      this._selected = [...this._selected, id];
    } else {
      this._selected = [id];
    }

    this.edgeless?.selectionManager.setSelection({
      elements: this._selected,
      editing: false,
    });
  };

  private _fitToElement(e: FitViewEvent) {
    const { block } = e.detail;
    const bound = Bound.deserialize(block.xywh);

    if (!this.edgeless) {
      this.changeEditorMode('edgeless');
      saveViewportToSession(this.page.id, {
        referenceId: block.id,
        padding: this.viewportPadding,
      });
    } else {
      this.edgeless.surface.viewport.setViewportByBound(
        bound,
        this.viewportPadding,
        true
      );
    }
  }

  private _drag(e: DragEvent) {
    if (!this._selected.length) return;

    this._dragging = true;

    const framesMap = this._frameItems.reduce((map, frame) => {
      map.set(frame.frame.id, {
        ...frame,
      });
      return map;
    }, new Map<string, FrameListItem>());
    const selected = this._selected.slice();

    const draggedFramesInfo = selected.map(id => {
      const frame = framesMap.get(id) as FrameListItem;

      return {
        frame: frame.frame,
        element: this.renderRoot.querySelector(
          `[data-frame-id="${frame.frame.id}"]`
        ) as FrameCard,
        cardIndex: frame.cardIndex,
        frameIndex: frame.frameIndex,
      };
    });
    const width = draggedFramesInfo[0].element.clientWidth;

    this._frameElementHeight = draggedFramesInfo[0].element.offsetHeight;

    startDragging(draggedFramesInfo, {
      width,
      container: this,
      doc: this.ownerDocument,
      host: this.host ?? this.ownerDocument,
      start: {
        x: e.detail.clientX,
        y: e.detail.clientY,
      },
      framePanelBody: this,
      frameListContainer: this.frameListContainer,
      frameElementHeight: this._frameElementHeight,
      edgeless: this.edgeless,
      page: this.page,
      root: this.root,
      onDragEnd: insertIdx => {
        this._dragging = false;
        this.insertIndex = undefined;

        if (insertIdx === undefined) return;
        this._reorderFrames(selected, framesMap, insertIdx);
      },
      onDragMove: (idx, indicatorTranslateY) => {
        this.insertIndex = idx;
        this._indicatorTranslateY = indicatorTranslateY ?? 0;
      },
    });
  }

  /**
   * click at blank area to clear selection
   */
  private _clickBlank = (e: MouseEvent) => {
    e.stopPropagation();
    // check if click at toc-card, if not, set this._selected to empty
    if (
      (e.target as HTMLElement).closest('frame-card') ||
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

  private _updateFrameItems = () => {
    this._frameItems = this.frames.map((frame, idx) => ({
      frame,
      frameIndex: frame.index,
      cardIndex: idx,
    }));
  };

  private _renderEmptyContent() {
    const emptyContent = html` <div class="no-frame-container">
      <div class="no-frame-placeholder">
        Add frames to organize and present your Edgeless
      </div>
    </div>`;

    return emptyContent;
  }

  private _renderFrameList() {
    const selectedFrames = new Set(this._selected);
    const frameCards = this._frameItems.map(
      (frameItem, idx) =>
        html`<frame-card
          data-frame-id=${frameItem.frame.id}
          .edgeless=${this.edgeless}
          .page=${this.page}
          .root=${this.root}
          .frame=${frameItem.frame}
          .cardIndex=${idx}
          .frameIndex=${frameItem.frameIndex}
          .status=${selectedFrames.has(frameItem.frame.id)
            ? this._dragging
              ? 'placeholder'
              : 'selected'
            : 'none'}
          @select=${this._selectFrame}
          @fitview=${this._fitToElement}
          @drag=${this._drag}
        ></frame-card>`
    );

    const frameList = html` <div class="frame-list-container">
      ${this.insertIndex !== undefined
        ? html`<div
            class="insert-indicator"
            style=${`transform: translateY(${this._indicatorTranslateY}px)`}
          ></div>`
        : nothing}
      ${frameCards}
    </div>`;
    return frameList;
  }

  override firstUpdated() {
    const disposables = this.disposables;
    disposables.addFromEvent(this, 'click', this._clickBlank);
  }

  override updated(_changedProperties: PropertyValues) {
    if (_changedProperties.has('page') || _changedProperties.has('edgeless')) {
      this._setPageDisposables(this.page);
    }

    if (_changedProperties.has('edgeless') && this.edgeless) {
      // after switch to edgeless mode, should update the selection
      this.edgeless.selectionManager.setSelection({
        elements: this._selected,
        editing: false,
      });
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    this._updateFrameItems();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._clearPageDisposables();
  }

  override render() {
    this._updateFrameItems();
    return html` ${this._frameItems.length
      ? this._renderFrameList()
      : this._renderEmptyContent()}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'frame-panel-body': FramePanelBody;
  }
}
