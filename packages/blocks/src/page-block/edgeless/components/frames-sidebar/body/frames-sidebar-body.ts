import '../card/frame-card.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';

import type { FrameBlockModel } from '../../../../../frame-block/frame-model.js';
import { EdgelessBlockType } from '../../../../../surface-block/edgeless-types.js';
import { Bound } from '../../../../../surface-block/utils/bound.js';
import { generateKeyBetween } from '../../../../../surface-block/utils/index.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
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
  :host {
    display: flex;
    width: 100%;
    height: 100%;
  }

  .frames-sidebar-body {
    display: flex;
    width: 100%;
  }

  .frame-list-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 12px;
    position: relative;

    /* overflow-y: scroll; */
  }

  .no-frames-container {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .no-frames-placeholder {
    margin-top: 240px;
    align-self: center;
    width: 230px;
    height: 48px;
    color: var(--affine-text-secondary-color, #8e8d91);
    text-align: center;

    /* light/base */
    font-size: 15px;
    font-family: 'Inter', sans-serif;
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

export class FramesSidebarBody extends WithDisposable(LitElement) {
  static override styles = styles;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  // Store the ids of the selected frames
  @state()
  private _selected: string[] = [];

  @state()
  private _dragging = false;

  @state()
  private _frameItems: FrameListItem[] = [];

  @property({ attribute: false })
  insertIndex?: number;

  @property({ attribute: false })
  fitPadding!: number[];

  @property({ attribute: false })
  host!: Document | HTMLElement;

  @query('.frame-list-container')
  frameListContainer!: HTMLElement;

  private _frameElementHeight = 0;

  get viewportPadding(): [number, number, number, number] {
    return this.fitPadding
      ? ([0, 0, 0, 0].map((val, idx) =>
          Number.isFinite(this.fitPadding[idx]) ? this.fitPadding[idx] : val
        ) as [number, number, number, number])
      : [0, 0, 0, 0];
  }

  private _updateFrames() {
    if (this._dragging) return;

    const frames = this.edgeless.surface.frame.frames.sort(
      this.edgeless.surface.compare
    ) as FrameBlockModel[];

    if (!frames.length) {
      this._selected = [];
      this._frameItems = [];
      return;
    }

    const frameItems: FramesSidebarBody['_frameItems'] = [];
    const oldSelectedSet = new Set(this._selected);
    const newSelected: string[] = [];

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
        .sort(this.edgeless.surface.compare);

      let before = frames[insertIndex - 1]?.index || null;
      const after = frames[insertIndex]?.index || null;
      selectedFrames.forEach(frame => {
        this.edgeless.surface.updateElement(frame.id, {
          index: generateKeyBetween(before, after),
        });
        before = frame.index;
      });

      this.edgeless.page.captureSync();
      this._updateFrames();
    }
  }

  private _selectFrame(e: SelectEvent) {
    const { selected, id, multiselect } = e.detail;

    if (!selected) {
      // de-select frame
      this._selected = this._selected.filter(frameId => frameId !== id);
    } else if (multiselect) {
      this._selected = [...this._selected, id];
    } else {
      this._selected = [id];
    }

    this.edgeless.selectionManager.setSelection({
      elements: this._selected,
      editing: false,
    });
  }

  private _fitToElement(e: FitViewEvent) {
    const { block } = e.detail;
    const bound = Bound.deserialize(block.xywh);

    this.edgeless.surface.viewport.setViewportByBound(
      bound,
      this.viewportPadding,
      true
    );
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
      frameListContainer: this.frameListContainer,
      onDragEnd: insertIdx => {
        this._dragging = false;
        this.insertIndex = undefined;

        if (insertIdx === undefined) return;
        // update selected frames index
        // make the indexes larger than the frame before and smaller than the frame after
        this._reorderFrames(selected, framesMap, insertIdx);
        // this._moveBlocks(insertIdx, selected, framesMap, frames);
      },
      onDragMove: idx => {
        this.insertIndex = idx;
      },
    });
  }

  private _renderEmptyContent() {
    const emptyContent = html` <div class="no-frames-container">
      <div class="no-frames-placeholder">
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
          style=${this.insertIndex !== undefined && idx >= this.insertIndex
            ? 'transform: translateY(20px)'
            : ''}
        ></frame-card>`
    );

    const frameList = html`<div class="frame-list-container">
      ${this.insertIndex !== undefined
        ? html`<div
            class="insert-indicator"
            style="transform: translateY(${this.insertIndex *
              (this._frameElementHeight + 10) +
            10}px)"
          ></div>`
        : nothing}
      ${frameCards}
    </div>`;

    return frameList;
  }

  override connectedCallback() {
    super.connectedCallback();
    const { surface, page } = this.edgeless;
    const frames = surface.frame.frames.sort(
      surface.compare
    ) as FrameBlockModel[];

    this._frameItems = frames.map((frame, idx) => ({
      frame,
      frameIndex: frame.index,
      cardIndex: idx,
    }));

    const { disposables } = this;
    disposables.add(
      page.slots.blockUpdated.on(({ flavour, type }) => {
        if (flavour === FRAME && type !== 'update') {
          requestAnimationFrame(() => {
            this._updateFrames();
          });
        }
      })
    );
    disposables.add(
      page.slots.blockUpdated.on(e => {
        if (e.type === 'update') {
          this._updateFrames();
        }
      })
    );
  }

  override render() {
    return html`<div class="frames-sidebar-body">
      ${this._frameItems.length
        ? this._renderFrameList()
        : this._renderEmptyContent()}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'frames-sidebar-body': FramesSidebarBody;
  }
}
