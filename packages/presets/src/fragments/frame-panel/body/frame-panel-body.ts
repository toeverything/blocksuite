import '../card/frame-card.js';

import {
  type EditorHost,
  ShadowlessElement,
  WithDisposable,
} from '@blocksuite/block-std';
import {
  Bound,
  type EdgelessRootBlockComponent,
  type FrameBlockModel,
  generateKeyBetween,
} from '@blocksuite/blocks';
import { DisposableGroup } from '@blocksuite/global/utils';
import type { Doc } from '@blocksuite/store';
import { css, html, nothing, type PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

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

const styles = css`
  .frame-list-container {
    display: flex;
    align-items: start;
    box-sizing: border-box;
    flex-direction: column;
    width: 100%;
    gap: 16px;
    position: relative;
    margin: 0 8px;
  }

  .no-frame-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 300px;
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

export class FramePanelBody extends WithDisposable(ShadowlessElement) {
  get frames() {
    const frames = this.doc.getBlockByFlavour(
      'affine:frame'
    ) as FrameBlockModel[];
    return frames.sort(this.compare);
  }

  get viewportPadding(): [number, number, number, number] {
    return this.fitPadding
      ? ([0, 0, 0, 0].map((val, idx) =>
          Number.isFinite(this.fitPadding[idx]) ? this.fitPadding[idx] : val
        ) as [number, number, number, number])
      : [0, 0, 0, 0];
  }

  static override styles = styles;

  // Store the ids of the selected frames
  @state()
  private accessor _selected: string[] = [];

  @state()
  private accessor _dragging = false;

  private _frameItems: FrameListItem[] = [];

  private _frameElementHeight = 0;

  private _indicatorTranslateY = 0;

  private _docDisposables: DisposableGroup | null = null;

  private _lastEdgelessRootId = '';

  @property({ attribute: false })
  accessor edgeless: EdgelessRootBlockComponent | null = null;

  @property({ attribute: false })
  accessor doc!: Doc;

  @property({ attribute: false })
  accessor editorHost!: EditorHost;

  @property({ attribute: false })
  accessor insertIndex: number | undefined = undefined;

  @property({ attribute: false })
  accessor fitPadding!: number[];

  @property({ attribute: false })
  accessor domHost!: Document | HTMLElement;

  @query('.frame-list-container')
  accessor frameListContainer!: HTMLElement;

  private _clearDocDisposables = () => {
    this._docDisposables?.dispose();
    this._docDisposables = null;
  };

  private _setDocDisposables(doc: Doc) {
    this._clearDocDisposables();
    this._docDisposables = new DisposableGroup();
    this._docDisposables.add(
      doc.slots.blockUpdated.on(({ flavour }) => {
        if (flavour === 'affine:frame') {
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
        frame.doc.updateBlock(frame, {
          index: newIndex,
        });
        before = newIndex;
      });

      this.doc.captureSync();
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

    this.edgeless?.service.selection.set({
      elements: this._selected,
      editing: false,
    });
  };

  private _fitToElement(e: FitViewEvent) {
    const { block } = e.detail;
    const bound = Bound.deserialize(block.xywh);

    if (!this.edgeless) {
      // When click frame card in page mode
      // Should switch to edgeless mode and set viewport to the frame
      const viewport = {
        xywh: block.xywh,
        referenceId: block.id,
        padding: this.viewportPadding as [number, number, number, number],
      };

      const rootService = this.editorHost.spec.getService('affine:page');
      rootService.editPropsStore.setStorage('viewport', viewport);
      rootService.docModeService.setMode('edgeless');
    } else {
      this.edgeless.service.viewport.setViewportByBound(
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
      document: this.ownerDocument,
      domHost: this.domHost ?? this.ownerDocument,
      start: {
        x: e.detail.clientX,
        y: e.detail.clientY,
      },
      framePanelBody: this,
      frameListContainer: this.frameListContainer,
      frameElementHeight: this._frameElementHeight,
      edgeless: this.edgeless,
      doc: this.doc,
      editorHost: this.editorHost,
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
    // check if click at frame-card, if not, set this._selected to empty
    if (
      (e.target as HTMLElement).closest('frame-card') ||
      this._selected.length === 0
    ) {
      return;
    }

    this._selected = [];
    this.edgeless?.service.selection.set({
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
    const frameCards = html`${repeat(
      this._frameItems,
      frameItem => [frameItem.frame.id, frameItem.cardIndex].join('-'),
      frameItem => {
        const { frame, frameIndex, cardIndex } = frameItem;
        return html`<frame-card
          data-frame-id=${frame.id}
          .edgeless=${this.edgeless}
          .doc=${this.doc}
          .host=${this.editorHost}
          .frame=${frame}
          .cardIndex=${cardIndex}
          .frameIndex=${frameIndex}
          .status=${selectedFrames.has(frame.id)
            ? this._dragging
              ? 'placeholder'
              : 'selected'
            : 'none'}
          @select=${this._selectFrame}
          @fitview=${this._fitToElement}
          @drag=${this._drag}
        ></frame-card>`;
      }
    )}`;

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

  compare(a: FrameBlockModel, b: FrameBlockModel) {
    if (a.index < b.index) return -1;
    else if (a.index > b.index) return 1;
    return 0;
  }

  override firstUpdated() {
    const disposables = this.disposables;
    disposables.addFromEvent(this, 'click', this._clickBlank);
  }

  override updated(_changedProperties: PropertyValues) {
    if (_changedProperties.has('doc') || _changedProperties.has('edgeless')) {
      this._setDocDisposables(this.doc);
    }

    if (_changedProperties.has('edgeless') && this.edgeless) {
      // after switch to edgeless mode, should update the selection
      if (this.edgeless.model.id === this._lastEdgelessRootId) {
        this.edgeless.service.selection.set({
          elements: this._selected,
          editing: false,
        });
      } else {
        this._selected = [];
      }
      this._lastEdgelessRootId = this.edgeless.model.id;
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    this._updateFrameItems();
    if (this.edgeless) {
      this._lastEdgelessRootId = this.edgeless.model.id;
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._clearDocDisposables();
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
