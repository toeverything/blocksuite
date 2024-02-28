import { BlockElement } from '@blocksuite/lit';
import type { BlockModel } from '@blocksuite/store';
import { css, html, nothing } from 'lit';
import { customElement, query, queryAll, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { DeleteIcon } from '../_common/icons/text.js';
import {
  getBlockElementsExcludeSubtrees,
  getModelByBlockComponent,
} from '../_common/utils/index.js';
import { AffineDragHandleWidget, ColumnsBlockSchema } from '../index.js';
import { AFFINE_DRAG_HANDLE_WIDGET } from '../root-block/widgets/drag-handle/drag-handle.js';
import { getDuplicateBlocks } from '../root-block/widgets/drag-handle/utils.js';
import { SPLIT_BAR_WIDTH } from './column-split-bar.js';
import type { ColumnsBlockModel } from './columns-model.js';
import { normalSizes } from './utils.js';

const MIN_COLUMN_WIDTH_PERCENT = 20;
const MAX_COLUMN_WIDTH_PERCENT = 80;
const MAX_COLUMN_NUMBER = 4;
const DROP_ZONE_OFFSET_WIDTH = 100;

@customElement('affine-columns')
export class ColumnsBlockComponent extends BlockElement<ColumnsBlockModel> {
  static override styles = css`
    .affine-columns-container {
      position: relative;
      width: 100%;
      padding-top: 20px;

      .affine-block-columns-grid {
        width: 100%;
        display: grid;
      }

      .affine-block-column-item {
        position: relative;
        background-color: var(--affine-background-secondary-color);
        padding: 0px 16px;
        border-radius: 8px;
        border: 1px solid var(--affine-border-color);

        affine-note {
          min-height: 100px;
        }
      }

      .affine-block-column-delete-button {
        position: absolute;
        top: 0;
        right: 0;
        z-index: 1;
        padding: 4px;

        icon-button {
          background-color: #fff;
        }

        &:hover {
          icon-button {
            background: var(--affine-background-error-color);
            color: var(--affine-error-color);

            svg {
              color: var(--affine-error-color);
            }
          }
        }
      }
    }
  `;

  @state()
  pixelSizes: number[] = [];

  @state()
  hoverChildId: string | null = null;

  @state()
  dragTargetIndex: number | null = null;

  @query('.affine-block-columns-grid')
  grid!: HTMLElement;

  @queryAll('affine-columns-split-bar')
  splitBars!: HTMLElement[];

  override async connectedCallback() {
    super.connectedCallback();

    this.disposables.add(
      this.model.propsUpdated.on(() => {
        this._refreshPixelSizes();
      })
    );

    this.handleEvent('pointerMove', ctx => {
      const state = ctx.get('pointerState');
      const { clientX: x, clientY: y } = state.raw;
      const rect = this.getBoundingClientRect();

      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        this.hoverChildId = null;
      }

      const children = this.model.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const childRect = this.grid.children[1 + i * 2].getBoundingClientRect();
        if (x > childRect.left && x < childRect.right) {
          this.hoverChildId = child.id;
          return;
        }
      }
    });

    this.handleEvent('pointerOut', ctx => {
      const state = ctx.get('pointerState');
      const { clientX: x, clientY: y } = state.raw;
      const rect = this.getBoundingClientRect();
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        this.hoverChildId = null;
      }
    });

    this.disposables.add(
      AffineDragHandleWidget.registerOption({
        flavour: ColumnsBlockSchema.model.flavour,

        onDragMove: state => {
          if (this.model.children.length === MAX_COLUMN_NUMBER) return false;

          const { clientX: x, clientY: y } = state.raw;
          const rect = this.getBoundingClientRect();

          if (
            x < rect.left - DROP_ZONE_OFFSET_WIDTH ||
            x > rect.right + DROP_ZONE_OFFSET_WIDTH ||
            y < rect.top ||
            y > rect.bottom
          ) {
            this.dragTargetIndex = null;
            return false;
          }

          if (x < rect.left) {
            this.dragTargetIndex = 0;
            return false;
          }

          if (x > rect.right) {
            this.dragTargetIndex = this.model.children.length;
            return false;
          }

          for (let i = 0; i < this.splitBars.length; i++) {
            const bar = this.splitBars[i];
            const barRect = bar.getBoundingClientRect();
            if (x > barRect.left && x < barRect.right) {
              this.dragTargetIndex = Number(bar.id.split('-')[2]);
              return false;
            }
          }

          this.dragTargetIndex = null;
          return false;
        },
        onDragEnd: ({ state, draggingElements }) => {
          const targetIndex = this.dragTargetIndex;
          this.dragTargetIndex = null;

          if (targetIndex !== null) {
            const columnNoteId = this._addColumn(targetIndex, false);
            if (columnNoteId) {
              const selectedBlocks = getBlockElementsExcludeSubtrees(
                draggingElements
              )
                .map(element => getModelByBlockComponent(element))
                .filter((x): x is BlockModel => !!x);

              if (selectedBlocks.length === 0) return true;

              const altKey = state.raw.altKey;
              if (altKey) {
                const duplicateBlocks = getDuplicateBlocks(selectedBlocks);
                this.doc.addBlocks(duplicateBlocks, columnNoteId);
              } else {
                this.doc.moveBlocks(
                  selectedBlocks,
                  this.doc.getBlockById(columnNoteId)!
                );
              }
            }

            return true;
          }
          return false;
        },
        onUpdateInsertion: ({ resetInsertion }) => {
          if (this.dragTargetIndex !== null) {
            resetInsertion();
            return true;
          }
          return false;
        },
      })
    );

    await this.updateComplete;

    this._refreshPixelSizes();
  }

  _addColumn(index: number, addEmptyParagraph = true): string | void {
    if (this.doc.readonly && this.model.children.length === MAX_COLUMN_NUMBER)
      return;

    const sizes =
      this.model.sizes.length === 1
        ? [50, 50]
        : normalSizes(
            [
              ...this.model.sizes.slice(0, index),
              100 / (this.model.children.length + 1),
              ...this.model.sizes.slice(index),
            ],
            100,
            MIN_COLUMN_WIDTH_PERCENT,
            MAX_COLUMN_WIDTH_PERCENT
          );

    let noteId: string | undefined;
    this.doc.transact(() => {
      noteId = this.doc.addBlock('affine:note', {}, this.model.id, index);
      this.model.sizes = sizes;
    });

    if (noteId && addEmptyParagraph) {
      const id = this.doc.addBlock('affine:paragraph', {}, noteId);
      this.host.selection.setGroup('note', [
        this.host.selection.create('text', {
          from: {
            path: [...this.path, noteId, id],
            index: 0,
            length: 0,
          },
          to: null,
        }),
      ]);
    }
    return noteId;
  }

  _removeColumn(child: BlockModel<object>) {
    if (this.model.children.length === 1) {
      this.doc.deleteBlock(this.model);
      return;
    }

    const index = this.model.children.indexOf(child);
    const sizes =
      this.model.sizes.length === 2
        ? [100]
        : normalSizes(
            [
              ...this.model.sizes.slice(0, index),
              ...this.model.sizes.slice(index + 1),
            ],
            100,
            MIN_COLUMN_WIDTH_PERCENT,
            MAX_COLUMN_WIDTH_PERCENT
          );

    this.doc.transact(() => {
      this.model.sizes = sizes;
      this.doc.deleteBlock(child);
    });
  }

  _refreshPixelSizes() {
    const gridWidth =
      this.grid.getBoundingClientRect().width -
      (this.model.children.length + 1) * SPLIT_BAR_WIDTH;
    this.pixelSizes = this.model.sizes.map(size => (size / 100) * gridWidth);
  }

  _getGridStyles() {
    return `grid-template-columns: ${SPLIT_BAR_WIDTH}px ${this.pixelSizes
      .flatMap(size => {
        return [size, SPLIT_BAR_WIDTH];
      })
      .filter(Boolean)
      .map(size => {
        return size + 'px';
      })
      .join(' ')};`;
  }

  _onSplitBarPointerDown(e: PointerEvent, index: number) {
    e.preventDefault();
    const bar = e.target as HTMLElement;
    bar.setAttribute('data-resizing', 'true');

    const leftChild = this.grid.children.item(index * 2 - 1) as HTMLElement;
    const rightChild = this.grid.children.item(index * 2 + 1) as HTMLElement;

    const startX = e.clientX;
    const leftWidth = leftChild.getBoundingClientRect().width;
    const rightWidth = rightChild.getBoundingClientRect().width;

    const drag = this.host.querySelector(
      AFFINE_DRAG_HANDLE_WIDGET
    ) as AffineDragHandleWidget;
    if (drag) {
      drag.dragging = true;
    }

    const inRange = (x: number) => {
      const width = this.grid.getBoundingClientRect().width;
      const min = (width * MIN_COLUMN_WIDTH_PERCENT) / 100;
      const max = (width * MAX_COLUMN_WIDTH_PERCENT) / 100;
      return x >= min && x <= max;
    };

    const onMouseMove = (e: PointerEvent) => {
      const diff = e.clientX - startX;
      const newLeftWidth = leftWidth + diff;
      const newRightWidth = rightWidth - diff;

      if (inRange(newLeftWidth) && inRange(newRightWidth)) {
        this.pixelSizes[index - 1] = newLeftWidth;
        this.pixelSizes[index] = newRightWidth;
        this.requestUpdate();
      }
    };

    const onMouseUp = () => {
      if (drag) {
        drag.dragging = false;
      }
      bar.removeAttribute('data-resizing');
      const gridWidth =
        this.grid.getBoundingClientRect().width -
        (this.model.children.length + 1) * SPLIT_BAR_WIDTH;

      this.doc.transact(() => {
        this.model.sizes = this.pixelSizes.map(
          size => (size / gridWidth) * 100
        );
      });

      window.removeEventListener('pointermove', onMouseMove);
      window.removeEventListener('pointerup', onMouseUp);
    };

    window.addEventListener('pointermove', onMouseMove);
    window.addEventListener('pointerup', onMouseUp);
  }

  override renderBlock() {
    const children = html`${repeat(
      this.model.children
        .flatMap((child, index) => {
          return [
            child,
            {
              type: 'columns-split-bar',
              id: `split-bar-${index + 1}`,
              index: index + 1,
              disabledResize: index + 1 === this.model.children.length,
            },
          ];
        })
        .filter(Boolean) as Array<
        | BlockModel<object>
        | {
            type: 'columns-split-bar';
            id: string;
            index: number;
            disabledResize: boolean;
          }
      >,
      child => child.id,
      child => {
        if ('type' in child && child.type === 'columns-split-bar') {
          return this.doc.readonly
            ? nothing
            : html`<affine-columns-split-bar
                id=${child.id}
                contenteditable="false"
                ?disabledaddcolumn=${this.pixelSizes.length >=
                MAX_COLUMN_NUMBER}
                ?disabled=${this.doc.readonly}
                ?disabledResize=${child.disabledResize ||
                this.dragTargetIndex !== null}
                ?isDragTarget=${this.dragTargetIndex === child.index}
                @pointerdown=${(e: PointerEvent) => {
                  if (child.disabledResize) return;
                  this._onSplitBarPointerDown(e, child.index);
                }}
                @add-column=${() => {
                  this._addColumn(child.index);
                }}
              ></affine-columns-split-bar>`;
        } else {
          return html`<div class="affine-block-column-item">
            ${this.renderModel(child as BlockModel<object>)}
            ${this.hoverChildId === child.id && !this.doc.readonly
              ? html`<div
                  class="affine-block-column-delete-button"
                  contenteditable="false"
                >
                  <icon-button
                    @click=${() => {
                      this._removeColumn(child as BlockModel<object>);
                    }}
                  >
                    ${DeleteIcon}
                  </icon-button>
                </div>`
              : nothing}
          </div>`;
        }
      }
    )}`;

    return html`<div class="affine-columns-container">
      <div class="affine-block-columns-grid" style=${this._getGridStyles()}>
        <affine-columns-split-bar
          id="split-bar-0"
          ?isDragTarget=${this.dragTargetIndex === 0}
          ?disabledaddcolumn=${this.pixelSizes.length >= MAX_COLUMN_NUMBER}
          ?disabled=${this.doc.readonly}
          ?disabledResize=${true}
          @add-column=${() => {
            this._addColumn(-1);
          }}
        ></affine-columns-split-bar>
        ${children}
      </div>
      <affine-block-selection .block=${this}></affine-block-selection>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-columns': ColumnsBlockComponent;
  }
}
