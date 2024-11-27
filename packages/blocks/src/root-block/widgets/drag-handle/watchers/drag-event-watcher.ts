import {
  captureEventTarget,
  getBlockComponentsExcludeSubtrees,
  getClosestBlockComponentByPoint,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';
import {
  type BlockComponent,
  type DndEventState,
  isGfxBlockComponent,
  type UIEventHandler,
  type UIEventStateContext,
} from '@blocksuite/block-std';
import { GfxControllerIdentifier } from '@blocksuite/block-std/gfx';
import { Bound, Point } from '@blocksuite/global/utils';
import { Job, Slice } from '@blocksuite/store';
import { render } from 'lit';
import * as lz from 'lz-string';

import type { AffineDragHandleWidget } from '../drag-handle.js';

import {
  HtmlAdapter,
  MarkdownAdapter,
} from '../../../../_common/adapters/index.js';
import {
  calcDropTarget,
  type DropResult,
} from '../../../../_common/utils/index.js';
import { DropIndicator } from '../components/drop-indicator.js';
import { AFFINE_DRAG_HANDLE_WIDGET } from '../consts.js';
import { containBlock, includeTextSelection } from '../utils.js';

export class DragEventWatcher {
  private _changeCursorToGrabbing = () => {
    document.documentElement.classList.add('affine-drag-preview-grabbing');
  };

  private _createDropIndicator = () => {
    if (!this.widget.dropIndicator) {
      this.widget.dropIndicator = new DropIndicator();
      this.widget.rootComponent.append(this.widget.dropIndicator);
    }
  };

  /**
   * When drag end, should move blocks to drop position
   */
  private _dragEndHandler: UIEventHandler = () => {
    this.widget.clearRaf();
    this.widget.hide(true);

    if (this.widget.mode === 'edgeless') {
      this.widget.edgelessWatcher.checkTopLevelBlockSelection();
    }

    return true;
  };

  /**
   * When dragging, should:
   * Update drag preview position
   * Update indicator position
   * Update drop block id
   */
  private _dragMoveHandler: UIEventHandler = ctx => {
    if (
      this.widget.isHoverDragHandleVisible ||
      this.widget.isTopLevelDragHandleVisible
    ) {
      this.widget.hide();
    }

    if (!this.widget.dragging || this.widget.draggingElements.length === 0) {
      return false;
    }

    ctx.get('defaultState').event.preventDefault();
    const state = ctx.get('dndState');

    for (const option of this.widget.optionRunner.options) {
      if (
        option.onDragMove?.({
          state,
          draggingElements: this.widget.draggingElements,
        })
      ) {
        return true;
      }
    }

    // call default drag move handler if no option return true
    return this._onDragMove(state);
  };

  /**
   * When start dragging, should set dragging elements and create drag preview
   */
  private _dragStartHandler: UIEventHandler = ctx => {
    const state = ctx.get('dndState');
    // If not click left button to start dragging, should do nothing
    const { button } = state.raw;
    if (button !== 0) {
      return false;
    }

    return this._onDragStart(state);
  };

  private _onDragMove = (state: DndEventState) => {
    this.widget.clearRaf();

    this.widget.rafID = requestAnimationFrame(() => {
      this.widget.edgelessWatcher.updateDragPreviewPosition(state);
      this.widget.updateDropIndicator(state, true);
    });
    return true;
  };

  private _onDragStart = (state: DndEventState) => {
    // Get current hover block element by path
    const hoverBlock = this.widget.anchorBlockComponent.peek();
    if (!hoverBlock) return false;

    const element = captureEventTarget(state.raw.target);
    const dragByHandle = !!element?.closest(AFFINE_DRAG_HANDLE_WIDGET);
    const isInSurface = isGfxBlockComponent(hoverBlock);

    if (isInSurface && dragByHandle) {
      const viewport = this.widget.std.get(GfxControllerIdentifier).viewport;
      const zoom = viewport.zoom ?? 1;
      const dragPreviewEl = document.createElement('div');
      const bound = Bound.deserialize(hoverBlock.model.xywh);
      const offset = new Point(bound.x * zoom, bound.y * zoom);

      // TODO: not use `dangerouslyRenderModel` to render drag preview
      render(
        this.widget.std.host.dangerouslyRenderModel(hoverBlock.model),
        dragPreviewEl
      );

      this._startDragging([hoverBlock], state, dragPreviewEl, offset);
      return true;
    }

    const selectBlockAndStartDragging = () => {
      this.widget.std.selection.setGroup('note', [
        this.widget.std.selection.create('block', {
          blockId: hoverBlock.blockId,
        }),
      ]);
      this._startDragging([hoverBlock], state);
    };

    if (this.widget.draggingElements.length === 0) {
      const dragByBlock =
        hoverBlock.contains(element) && !hoverBlock.model.text;

      const canDragByBlock =
        matchFlavours(hoverBlock.model, [
          'affine:attachment',
          'affine:bookmark',
        ]) || hoverBlock.model.flavour.startsWith('affine:embed-');

      if (!isInSurface && dragByBlock && canDragByBlock) {
        selectBlockAndStartDragging();
        return true;
      }
    }

    // Should only start dragging when pointer down on drag handle
    // And current mouse button is left button
    if (!dragByHandle) {
      this.widget.hide();
      return false;
    }

    if (this.widget.draggingElements.length === 1) {
      if (!isInSurface) {
        selectBlockAndStartDragging();
        return true;
      }
    }

    if (!this.widget.isHoverDragHandleVisible) return false;

    let selections = this.widget.selectionHelper.selectedBlocks;

    // When current selection is TextSelection
    // Should set BlockSelection for the blocks in native range
    if (selections.length > 0 && includeTextSelection(selections)) {
      const nativeSelection = document.getSelection();
      const rangeManager = this.widget.std.range;
      if (nativeSelection && nativeSelection.rangeCount > 0 && rangeManager) {
        const range = nativeSelection.getRangeAt(0);
        const blocks = rangeManager.getSelectedBlockComponentsByRange(range, {
          match: el => el.model.role === 'content',
          mode: 'highest',
        });
        this.widget.selectionHelper.setSelectedBlocks(blocks);
        selections = this.widget.selectionHelper.selectedBlocks;
      }
    }

    // When there is no selected blocks
    // Or selected blocks not including current hover block
    // Set current hover block as selected
    if (
      selections.length === 0 ||
      !containBlock(
        selections.map(selection => selection.blockId),
        this.widget.anchorBlockId.peek()!
      )
    ) {
      const block = this.widget.anchorBlockComponent.peek();
      if (block) {
        this.widget.selectionHelper.setSelectedBlocks([block]);
      }
    }

    const blocks = this.widget.selectionHelper.selectedBlockComponents;

    // This could be skip if we can ensure that all selected blocks are on the same level
    // Which means not selecting parent block and child block at the same time
    const blocksExcludingChildren = getBlockComponentsExcludeSubtrees(
      blocks
    ) as BlockComponent[];

    if (blocksExcludingChildren.length === 0) return false;

    this._startDragging(blocksExcludingChildren, state);
    this.widget.hide();
    return true;
  };

  private _onDrop = (context: UIEventStateContext) => {
    const state = context.get('dndState');
    const event = state.raw;
    const { clientX, clientY } = event;
    const point = new Point(clientX, clientY);
    const element = getClosestBlockComponentByPoint(point.clone());
    if (!element) return;
    const model = element.model;
    const parent = this.widget.std.doc.getParent(model.id);
    if (!parent) return;
    if (matchFlavours(parent, ['affine:surface'])) {
      return;
    }
    const result: DropResult | null = calcDropTarget(point, model, element);
    if (!result) return;

    const index =
      parent.children.indexOf(model) + (result.type === 'before' ? 0 : 1);
    this._deserializeData(state, parent.id, index).catch(console.error);
  };

  private _startDragging = (
    blocks: BlockComponent[],
    state: DndEventState,
    dragPreviewEl?: HTMLElement,
    dragPreviewOffset?: Point
  ) => {
    if (!blocks.length) {
      return;
    }

    this.widget.draggingElements = blocks;

    this.widget.dragPreview = this.widget.previewHelper.createDragPreview(
      blocks,
      state,
      dragPreviewEl,
      dragPreviewOffset
    );

    const slice = Slice.fromModels(
      this.widget.std.doc,
      blocks.map(block => block.model)
    );

    this.widget.dragging = true;
    this._changeCursorToGrabbing();
    this._createDropIndicator();
    this.widget.hide();
    this._serializeData(slice, state).catch(console.error);
  };

  constructor(readonly widget: AffineDragHandleWidget) {}

  private async _deserializeData(
    state: DndEventState,
    parent?: string,
    index?: number
  ) {
    try {
      const dataTransfer = state.raw.dataTransfer;
      if (!dataTransfer) throw new Error('No data transfer');

      const job = new Job({
        collection: this.widget.std.collection,
      });

      const std = this.widget.std;
      const html = dataTransfer.getData('text/html');
      if (html) {
        const domParser = new DOMParser();
        const doc = domParser.parseFromString(html, 'text/html');
        const dom = doc.querySelector<HTMLDivElement>(
          '[data-blocksuite-snapshot]'
        );
        if (dom) {
          // use snapshot
          const json = JSON.parse(
            lz.decompressFromEncodedURIComponent(
              dom.dataset.blocksuiteSnapshot as string
            )
          );
          const slice = await job.snapshotToSlice(json, std.doc, parent, index);
          return slice;
        }

        // use html parser;
        const htmlAdapter = new HtmlAdapter(job);
        const slice = await htmlAdapter.toSlice(
          { file: html },
          std.doc,
          parent,
          index
        );
        return slice;
      }

      const text = dataTransfer.getData('text/plain');
      const textAdapter = new MarkdownAdapter(job);
      const slice = await textAdapter.toSlice(
        { file: text },
        std.doc,
        parent,
        index
      );
      return slice;
    } catch {
      return null;
    }
  }

  private async _serializeData(slice: Slice, state: DndEventState) {
    const dataTransfer = state.raw.dataTransfer;
    if (!dataTransfer) return;

    const job = new Job({
      middlewares: [],
      collection: this.widget.std.collection,
    });
    const textAdapter = new MarkdownAdapter(job);
    const htmlAdapter = new HtmlAdapter(job);

    const snapshot = await job.sliceToSnapshot(slice);
    const text = await textAdapter.fromSlice(slice);
    const innerHTML = await htmlAdapter.fromSlice(slice);
    if (!snapshot || !text || !innerHTML) return;

    const snapshotCompressed = lz.compressToEncodedURIComponent(
      JSON.stringify(snapshot)
    );
    const html = `<div data-blocksuite-snapshot=${snapshotCompressed}>${innerHTML.file}</div>`;
    dataTransfer.setData('text/plain', text.file);
    dataTransfer.setData('text/html', html);
  }

  watch() {
    this.widget.handleEvent('pointerDown', ctx => {
      const state = ctx.get('pointerState');
      const event = state.raw;
      const target = captureEventTarget(event.target);
      if (!target) return;

      if (this.widget.contains(target)) {
        return true;
      }

      return;
    });

    this.widget.handleEvent('dragStart', ctx => {
      const state = ctx.get('pointerState');
      const event = state.raw;
      const target = captureEventTarget(event.target);
      if (!target) return;

      if (this.widget.contains(target)) {
        return true;
      }

      return;
    });
    this.widget.handleEvent('nativeDragStart', this._dragStartHandler, {
      global: true,
    });
    this.widget.handleEvent('nativeDragMove', this._dragMoveHandler, {
      global: true,
    });
    this.widget.handleEvent('nativeDragEnd', this._dragEndHandler, {
      global: true,
    });
    this.widget.handleEvent('nativeDrop', this._onDrop, {
      global: true,
    });
  }
}
