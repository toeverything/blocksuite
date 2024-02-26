import { BlockElement } from '@blocksuite/lit';
import type { BlockModel } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { matchFlavours } from '../_common/utils/index.js';
import type { AffineDragHandleWidget } from '../page-block/widgets/drag-handle/drag-handle.js';
import { AFFINE_DRAG_HANDLE_WIDGET } from '../page-block/widgets/drag-handle/drag-handle.js';
import { SPLIT_BAR_WIDTH } from './column-split-bar.js';
import type { ColumnsBlockModel } from './columns-model.js';

const MIN_COLUMN_WIDTH_PERCENT = 20;
const MAX_COLUMN_WIDTH_PERCENT = 80;

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
        background-color: var(--affine-background-secondary-color);
        padding: 0px 16px;
        border-radius: 8px;
        border: 1px solid var(--affine-border-color);

        affine-note {
          min-height: 100px;
        }
      }
    }
  `;

  @state()
  pixelSizes: number[] = [];

  @query('.affine-block-columns-grid')
  grid!: HTMLElement;

  override async connectedCallback() {
    super.connectedCallback();
    this.disposables.add(
      this.page.slots.blockUpdated.on(
        this._checkLastBlockIsParagraph.bind(this)
      )
    );

    this.disposables.add(
      this.model.propsUpdated.on(() => {
        this._refreshPixelSizes();
      })
    );

    this._checkLastBlockIsParagraph();

    await this.updateComplete;

    this._refreshPixelSizes();
  }

  _checkLastBlockIsParagraph() {
    this.model.children.forEach(note => {
      if (matchFlavours(note, ['affine:note'])) {
        const lastChild = note.children[note.children.length - 1];
        if (!lastChild || !matchFlavours(lastChild, ['affine:paragraph'])) {
          this.page.addBlock('affine:paragraph', {}, note.id);
        }
      }
    });
  }

  _addColumn(index: number) {
    const noteId = this.page.addBlock(
      'affine:note',
      {},
      this.model.id,
      index + 1
    );
    const avgSize = 100 / (this.model.sizes.length + 1);
    const left = this.model.sizes[index] - avgSize / 2;
    const right = this.model.sizes[index] - avgSize / 2;

    let sizes: number[] = [];
    if (index !== 0) {
      sizes = this.model.sizes.slice(0, index - 1);
    }
    sizes.push(left);
    sizes.push(avgSize);
    sizes.push(right);
    if (this.model.sizes.length > 2) {
      sizes = sizes.concat(this.model.sizes.slice(index + 2));
    }

    this.model.sizes = sizes;

    this.page.addBlock(
      'affine:paragraph',
      {
        type: 'text',
        text: this.page.Text.fromDelta([{ insert: 'New column ' }]),
      },
      noteId,
      0
    );
  }

  _refreshPixelSizes() {
    const gridWidth =
      this.grid.getBoundingClientRect().width -
      this.model.children.length * SPLIT_BAR_WIDTH;
    this.pixelSizes = this.model.sizes.map(size => (size / 100) * gridWidth);
  }

  _getGridStyles() {
    return `grid-template-columns: ${this.pixelSizes
      .slice(0, -1)
      .flatMap((size, index) => {
        return [
          size,
          index !== this.pixelSizes.length - 1 ? SPLIT_BAR_WIDTH : null,
        ];
      })
      .filter(Boolean)
      .map(size => {
        return size + 'px';
      })
      .join(' ')} auto;`;
  }

  _onSplitBarPointerDown(e: PointerEvent, index: number) {
    e.preventDefault();
    const bar = e.target as HTMLElement;
    bar.setAttribute('data-dragging', 'true');

    const leftChild = this.grid.children.item(index * 2) as HTMLElement;
    const rightChild = this.grid.children.item((index + 1) * 2) as HTMLElement;

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
        this.model.children.length * SPLIT_BAR_WIDTH;

      this.model.sizes = this.pixelSizes.map(size =>
        Math.floor((size / gridWidth) * 100)
      );

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
            index !== this.model.children.length - 1
              ? {
                  type: 'columns-split-bar',
                  id: `split-bar-${index}`,
                  index,
                }
              : null,
          ];
        })
        .filter(Boolean) as Array<
        | BlockModel<object>
        | { type: 'columns-split-bar'; id: string; index: number }
      >,
      child => child.id,
      child => {
        if ('type' in child && child.type === 'columns-split-bar') {
          return html`<affine-columns-split-bar
            id=${child.id}
            @pointerdown=${(e: PointerEvent) => {
              this._onSplitBarPointerDown(e, child.index);
            }}
            @add-column=${() => {
              this._addColumn(child.index);
            }}
          ></affine-columns-split-bar>`;
        } else {
          return html`<div class="affine-block-column-item">
            ${this.renderModel(child as BlockModel<object>)}
          </div>`;
        }
      }
    )}`;
    return html`<div class="affine-columns-container">
      <div class="affine-block-columns-grid" style=${this._getGridStyles()}>
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
