import type { Doc } from '@blocksuite/store';

import { CommonUtils } from '@blocksuite/affine-block-surface';
import { type EditorHost, ShadowlessElement } from '@blocksuite/block-std';
import {
  DocModeProvider,
  EdgelessRootService,
  EditPropsStore,
  type FrameBlockModel,
} from '@blocksuite/blocks';
import {
  Bound,
  DisposableGroup,
  WithDisposable,
} from '@blocksuite/global/utils';
import { css, html, nothing, type PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
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

export const AFFINE_FRAME_PANEL_BODY = 'affine-frame-panel-body';

export class FramePanelBody extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  private _clearDocDisposables = () => {
    this._docDisposables?.dispose();
    this._docDisposables = null;
  };

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
    this._edgelessRootService?.selection.set({
      elements: this._selected,
      editing: false,
    });
  };

  private _docDisposables: DisposableGroup | null = null;

  private _frameElementHeight = 0;

  private _frameItems: FrameListItem[] = [];

  private _indicatorTranslateY = 0;

  private _lastEdgelessRootId = '';

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

    this._edgelessRootService?.selection.set({
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

  get _edgelessRootService() {
    return this.editorHost.std.getOptional(EdgelessRootService);
  }

  get frames() {
    const frames = this.editorHost.doc
      .getBlocksByFlavour('affine:frame')
      .map(block => block.model as FrameBlockModel);
    return frames.sort(this.compare);
  }

  get viewportPadding(): [number, number, number, number] {
    return this.fitPadding
      ? ([0, 0, 0, 0].map((val, idx) =>
          Number.isFinite(this.fitPadding[idx]) ? this.fitPadding[idx] : val
        ) as [number, number, number, number])
      : [0, 0, 0, 0];
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
      onDragEnd: insertIdx => {
        this._dragging = false;
        this.insertIndex = undefined;

        if (insertIdx === undefined || this._frameItems.length <= 1) return;
        this._reorderFrames(selected, framesMap, insertIdx);
      },
      onDragMove: (idx, indicatorTranslateY) => {
        this.insertIndex = idx;
        this._indicatorTranslateY = indicatorTranslateY ?? 0;
      },
    });
  }

  private _fitToElement(e: FitViewEvent) {
    const { block } = e.detail;
    const bound = Bound.deserialize(block.xywh);

    if (!this._edgelessRootService) {
      // When click frame card in page mode
      // Should switch to edgeless mode and set viewport to the frame
      const viewport = {
        xywh: block.xywh,
        referenceId: block.id,
        padding: this.viewportPadding as [number, number, number, number],
      };

      this.editorHost.std.get(EditPropsStore).setStorage('viewport', viewport);
      this.editorHost.std.get(DocModeProvider).setEditorMode('edgeless');
    } else {
      this._edgelessRootService.viewport.setViewportByBound(
        bound,
        this.viewportPadding,
        true
      );
    }
  }

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
    const frameCards = html`${repeat(this._frameItems, frameItem => {
      const { frame, frameIndex, cardIndex } = frameItem;
      return keyed(
        frame,
        html`<affine-frame-card
          data-frame-id=${frame.id}
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
        ></affine-frame-card>`
      );
    })}`;

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
        const newIndex = CommonUtils.generateKeyBetween(before, after);
        frame.doc.updateBlock(frame, {
          index: newIndex,
        });
        before = newIndex;
      });

      this.editorHost.doc.captureSync();
      this._updateFrames();
    }
  }

  private _setDocDisposables(doc: Doc) {
    this._clearDocDisposables();
    this._docDisposables = new DisposableGroup();
    this._docDisposables.add(
      doc.slots.blockUpdated.on(({ type, flavour }) => {
        if (flavour === 'affine:frame' && type !== 'update') {
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

  compare(a: FrameBlockModel, b: FrameBlockModel) {
    if (a.index < b.index) return -1;
    else if (a.index > b.index) return 1;
    return 0;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._updateFrameItems();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._clearDocDisposables();
  }

  override firstUpdated() {
    const disposables = this.disposables;
    disposables.addFromEvent(this, 'click', this._clickBlank);
  }

  override render() {
    this._updateFrameItems();
    return html` ${this._frameItems.length
      ? this._renderFrameList()
      : this._renderEmptyContent()}`;
  }

  override updated(_changedProperties: PropertyValues) {
    if (_changedProperties.has('editorHost') && this.editorHost) {
      this._setDocDisposables(this.editorHost.doc);
      // after switch to edgeless mode, should update the selection
      if (this.editorHost.doc.id === this._lastEdgelessRootId) {
        this._edgelessRootService?.selection.set({
          elements: this._selected,
          editing: false,
        });
      } else {
        this._selected = [];
      }
      this._lastEdgelessRootId = this.editorHost.doc.id;
    }
  }

  @state()
  private accessor _dragging = false;

  // Store the ids of the selected frames
  @state()
  private accessor _selected: string[] = [];

  @property({ attribute: false })
  accessor domHost!: Document | HTMLElement;

  @property({ attribute: false })
  accessor editorHost!: EditorHost;

  @property({ attribute: false })
  accessor fitPadding!: number[];

  @query('.frame-list-container')
  accessor frameListContainer!: HTMLElement;

  @property({ attribute: false })
  accessor insertIndex: number | undefined = undefined;
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_FRAME_PANEL_BODY]: FramePanelBody;
  }
}
