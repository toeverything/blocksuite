import { BlockElement } from '@blocksuite/lit';
import type { BlockModel } from '@blocksuite/store';
import { css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { DeleteIcon } from '../_common/icons/text.js';
import type { AffineDragHandleWidget } from '../index.js';
import { AFFINE_DRAG_HANDLE_WIDGET } from '../root-block/widgets/drag-handle/drag-handle.js';
import { SPLIT_BAR_WIDTH } from './column-split-bar.js';
import type { ColumnsBlockModel } from './columns-model.js';
import { normalSizes } from './utils.js';

const MIN_COLUMN_WIDTH_PERCENT = 20;
const MAX_COLUMN_WIDTH_PERCENT = 80;
const MAX_COLUMN_NUMBER = 4;

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

  @query('.affine-block-columns-grid')
  grid!: HTMLElement;

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

    await this.updateComplete;

    this._refreshPixelSizes();
  }

  _addColumn(index: number) {
    if (this.doc.readonly && this.model.children.length === MAX_COLUMN_NUMBER)
      return;
    const sizes =
      this.model.sizes.length === 1
        ? [50, 50]
        : normalSizes(
            [
              ...this.model.sizes.slice(0, index + 1),
              100 / (this.model.children.length + 1),
              ...this.model.sizes.slice(index + 1),
            ],
            100,
            MIN_COLUMN_WIDTH_PERCENT,
            MAX_COLUMN_WIDTH_PERCENT
          );

    let noteId: string | undefined;
    this.doc.transact(() => {
      noteId = this.doc.addBlock('affine:note', {}, this.model.id, index + 1);
      this.model.sizes = sizes;
    });

    if (noteId) {
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
    bar.setAttribute('data-dragging', 'true');

    const leftChild = this.grid.children.item(1 + index * 2) as HTMLElement;
    const rightChild = this.grid.children.item(
      1 + (index + 1) * 2
    ) as HTMLElement;

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
        this.pixelSizes[index] = newLeftWidth;
        this.pixelSizes[index + 1] = newRightWidth;
        this.requestUpdate();
      }
    };

    const onMouseUp = () => {
      if (drag) {
        drag.dragging = false;
      }
      bar.removeAttribute('data-dragging');
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
              id: `split-bar-${index}`,
              index,
              disabledDrag: index === this.model.children.length - 1,
            },
          ];
        })
        .filter(Boolean) as Array<
        | BlockModel<object>
        | {
            type: 'columns-split-bar';
            id: string;
            index: number;
            disabledDrag: boolean;
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
                ?disabledDrag=${child.disabledDrag}
                @pointerdown=${(e: PointerEvent) => {
                  if (child.disabledDrag) return;
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
          ?disabledaddcolumn=${this.pixelSizes.length >= MAX_COLUMN_NUMBER}
          ?disabled=${this.doc.readonly}
          ?disabledDrag=${true}
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
