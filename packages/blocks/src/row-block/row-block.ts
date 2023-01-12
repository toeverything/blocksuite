import { css, html } from 'lit';
import type { RowBlockModel } from './row-model.js';
import type { BlockHost } from '../__internal__/index.js';
import {
  BLOCK_ID_ATTR,
  BlockElementWithService,
  NonShadowLitElement,
} from '../__internal__/index.js';
import { customElement, property } from 'lit/decorators.js';
import { assertEquals } from '@blocksuite/global/utils';
import type { DatabaseBlockModel } from '../database-block/index.js';
import ColumnTypes = BlockSuiteInternal.ColumnTypes;
import type { BaseBlockModel } from '@blocksuite/store';
import BlockTag = BlockSuiteInternal.BlockTag;
import { repeat } from 'lit/directives/repeat.js';

function withCell<Args extends unknown[]>(fn: (...args: Args) => unknown) {
  return function CellWrapper(...args: [ColumnTypes, ...Args]) {
    const [column, ...props] = args;
    return html`
      <div
        class="affine-row-block-cell"
        style="width: ${column.metadata.width}px"
      >
        ${fn(...props)}
      </div>
    `;
  };
}

const BlockCell = withCell(
  (model: BaseBlockModel, host: BlockHost, onLoaded: () => void) => {
    return html`${BlockElementWithService(model, host, onLoaded)}`;
  }
);

const TagCell = withCell((tag: BlockTag) => {
  return html` ${tag.value} `;
});

const Placeholder = withCell(() => {
  return html`unknown`;
});

@customElement('affine-row')
export class RowBlock extends NonShadowLitElement {
  static styles = css`
    .affine-row-block-container {
      display: flex;
      flex-direction: row;
      align-items: center;
      width: 100%;
      min-height: 32px;
    }
    .affine-row-block-cell {
      display: inline-block;
      color: var(--affine-text-color);
      border-right: 1px solid rgb(238, 238, 237);
    }
  `;
  @property({
    hasChanged() {
      return true;
    },
  })
  model!: RowBlockModel;

  @property()
  host!: BlockHost;

  firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  get columns(): ColumnTypes[] {
    const model = this.model.page.getParent(this.model);
    assertEquals(model?.flavour, 'affine:database');
    const parent = model as DatabaseBlockModel;
    return parent.columns;
  }

  get tags() {
    return this.model.page.getBlockTags(this.model);
  }

  protected render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
    const tags = this.tags;
    let idx = 0;
    return html`
      <div class="affine-row-block-container">
        ${repeat(
          this.columns,
          column => column.id,
          column => {
            if (column.type === 'affine-column:single-text') {
              throw new Error('not supported');
              const block = this.model.children[idx];
              idx++;
              if (block) {
                return BlockCell(column, block, this.host, () => {
                  this.requestUpdate();
                });
              } else {
                return Placeholder(column);
              }
            }
            const tag = tags[column.id];
            if (tag) {
              return TagCell(column, tag);
            } else {
              return Placeholder(column);
            }
          }
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-row': RowBlock;
  }
}
