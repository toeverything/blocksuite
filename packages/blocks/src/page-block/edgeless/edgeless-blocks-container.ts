import './components/edgeless-notes-container.js';
import './components/rects/edgeless-selected-rect.js';
import './components/rects/edgeless-hover-rect.js';
import './components/rects/edgeless-dragging-area-rect.js';
import './components/note-slicer/index.js';

import { throttle } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { type BaseBlockModel } from '@blocksuite/store';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  EDGELESS_BLOCK_CHILD_BORDER_WIDTH,
  EDGELESS_BLOCK_CHILD_PADDING,
} from '../../__internal__/consts.js';
import { getRectByBlockElement } from '../../__internal__/utils/query.js';
import type { TopLevelBlockModel } from '../../__internal__/utils/types.js';
import { almostEqual, Bound } from '../../surface-block/index.js';
import { EdgelessNotesStatus } from './components/notes-status.js';
import { updateNotesPosition } from './components/utils.js';
import type { EdgelessPageBlockComponent } from './edgeless-page-block.js';
import { NoteResizeObserver } from './utils/note-resize-observer.js';
import { getBackgroundGrid } from './utils/query.js';

@customElement('affine-edgeless-block-container')
export class EdgelessBlockContainer extends WithDisposable(LitElement) {
  static override styles = css`
    .widgets-container {
      position: absolute;
      left: 0;
      top: 0;
      contain: size layout;
    }
  `;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @state()
  private _selectedBlockRects: DOMRect[] = [];

  private get _selection() {
    return this.edgeless.selectionManager;
  }

  private _noteResizeObserver = new NoteResizeObserver();

  private _initNoteHeightUpdate() {
    const { page } = this.edgeless;
    const resetNoteResizeObserver = throttle(
      () => {
        requestAnimationFrame(() => {
          this._noteResizeObserver.resetListener(page);
        });
      },
      16,
      { leading: true }
    );
    const listenChildrenUpdate = (root: BaseBlockModel<object> | null) => {
      if (!root) return;

      this._disposables.add(root.childrenUpdated.on(resetNoteResizeObserver));
    };

    listenChildrenUpdate(page.root);
    this._disposables.add(
      page.slots.rootAdded.on(root => listenChildrenUpdate(root))
    );
  }

  override firstUpdated() {
    const { _disposables, edgeless, _selection } = this;
    const { surface, page } = edgeless;

    this._initNoteHeightUpdate();

    requestAnimationFrame(() => {
      this._noteResizeObserver.resetListener(page);
    });

    _disposables.add(this._noteResizeObserver);

    _disposables.add(
      this._noteResizeObserver.slots.resize.on(resizedNotes => {
        resizedNotes.forEach(([domRect, prevDomRect], id) => {
          if (page.readonly) return;
          const model = page.getBlockById(id) as TopLevelBlockModel;
          const { index, xywh } = model;
          const { x, y, w, h } = Bound.deserialize(xywh);

          if (index < edgeless.indexes.min) {
            edgeless.indexes.min = index;
          } else if (index > edgeless.indexes.max) {
            edgeless.indexes.max = index;
          }

          // ResizeObserver is not effected by CSS transform, so don't deal with viewport zoom.
          const newModelHeight =
            domRect.height +
            EDGELESS_BLOCK_CHILD_PADDING * 2 +
            EDGELESS_BLOCK_CHILD_BORDER_WIDTH * 2;

          if (!almostEqual(newModelHeight, h)) {
            const updateBlock = () => {
              page.updateBlock(model, {
                xywh: JSON.stringify([x, y, w, Math.round(newModelHeight)]),
              });
            };

            // Assume it's user-triggered resizing if both width and height change,
            // otherwise we don't add the size updating into history.
            // See https://github.com/toeverything/blocksuite/issues/3671
            const isResize =
              prevDomRect && !almostEqual(domRect.width, prevDomRect.width);
            if (isResize) {
              updateBlock();
            } else {
              page.withoutTransact(updateBlock);
            }
          }
        });

        edgeless.slots.selectedRectUpdated.emit({ type: 'resize' });
      })
    );
    _disposables.add(
      _selection.slots.blocksUpdated.on(selectedBlocks => {
        _selection.selectedBlocks = selectedBlocks;
        // TODO: remove `requestAnimationFrame`
        requestAnimationFrame(() => {
          this._selectedBlockRects = selectedBlocks.map(getRectByBlockElement);
        });
      })
    );

    _disposables.add(
      edgeless.slots.viewportUpdated.on(() => {
        const prevZoom = this.style.getPropertyValue('--affine-zoom');
        const newZoom = surface.viewport.zoom;
        if (!prevZoom || +prevZoom !== newZoom) {
          this.style.setProperty('--affine-zoom', `${newZoom}`);
        }
        const { showGrid } = edgeless;
        const { zoom, viewportX, viewportY } = surface.viewport;

        const { grid, gap, translateX, translateY } = getBackgroundGrid(
          viewportX,
          viewportY,
          zoom,
          showGrid
        );

        this.style.setProperty('--affine-edgeless-gap', `${gap}px`);
        this.style.setProperty('--affine-edgeless-grid', grid);
        this.style.setProperty('--affine-edgeless-x', `${translateX}px`);
        this.style.setProperty('--affine-edgeless-y', `${translateY}px`);

        if (_selection.selectedBlocks.length) {
          _selection.setSelectedBlocks([..._selection.selectedBlocks]);
        }

        updateNotesPosition(edgeless, edgeless.notes);
      })
    );

    _disposables.add(
      page.slots.historyUpdated.on(() => {
        this.requestUpdate();
      })
    );
  }

  override render() {
    const { edgeless, _selectedBlockRects } = this;
    const { sortedNotes, surface, renderModel } = edgeless;
    if (!surface) return nothing;

    const { viewport } = surface;
    const { left, top } = viewport;
    const widgets = html`${repeat(
      Object.entries(edgeless.widgets),
      ([id]) => id,
      ([_, widget]) => widget
    )}`;

    const { readonly } = this.edgeless.page;
    return html`
      <div class="affine-block-children-container edgeless">
        <div class="affine-edgeless-layer">
          ${readonly
            ? nothing
            : html`<affine-note-slicer
                .edgelessPage=${edgeless}
              ></affine-note-slicer>`}
          <edgeless-notes-container
            .edgeless=${edgeless}
            .notes=${sortedNotes}
            .renderer=${renderModel.bind(this)}
          ></edgeless-notes-container>
        </div>
      </div>
      <affine-selected-blocks
        .mouseRoot=${edgeless.mouseRoot}
        .state=${{
          rects: _selectedBlockRects,
          grab: false,
        }}
        .offset=${{
          x: -left,
          y: -top,
        }}
      ></affine-selected-blocks>
      <edgeless-hover-rect .edgeless=${edgeless}></edgeless-hover-rect>
      <edgeless-dragging-area-rect
        .edgeless=${edgeless}
      ></edgeless-dragging-area-rect>
      <edgeless-selected-rect .edgeless=${edgeless}></edgeless-selected-rect>
      ${EdgelessNotesStatus(edgeless, edgeless.notes)}
      <div class="widgets-container">${widgets}</div>
    `;
  }

  override createRenderRoot() {
    return this;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-block-container': EdgelessBlockContainer;
  }
}
