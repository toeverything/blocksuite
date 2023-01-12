import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DatabaseBlockModel } from './database-model.js';
import {
  BLOCK_ID_ATTR,
  BlockElementWithService,
  BlockHost,
  NonShadowLitElement,
} from '../__internal__/index.js';
import { repeat } from 'lit/directives/repeat.js';
import TagTypes = BlockSuiteInternal.TagTypes;

function TagCircle(tag: TagTypes) {
  return html`
    <div
      class="affine-database-block-tag-circle"
      style="background-color: ${tag.metadata.color}"
    ></div>
  `;
}

function DataBaseRowContainer(block: DatabaseBlock) {
  const model = block.model;
  const host = block.host;

  return html`
    <style>
      .affine-database-block-rows {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
      }

      .affine-database-block-row-container {
        width: 100%;
        display: block;
      }

      .affine-database-block-row {
      }

      .affine-database-block-tags {
        display: flex;
        flex-direction: row;
        gap: 10px;
      }
    </style>
    <div class="affine-database-block-rows">
      ${repeat(
        model.children,
        child => child.id,
        (child, idx) => {
          return html`
            <div
              class="affine-database-block-row-container"
              data-row-id="${idx}"
            >
              <div class="affine-database-block-row">
                ${BlockElementWithService(child, host, () => {
                  block.requestUpdate();
                })}
              </div>
              <div class="affine-database-block-tags">
                ${block.rows[idx].map((row, colIdx) => {
                  const column = block.model.columns[colIdx];
                  return html` <div data-col-id="${colIdx}">
                    ${row === null
                      ? TagCircle(column)
                      : html` <div
                          class="affine-database-block-tag"
                          style="background-color: ${column.metadata.color}"
                        >
                          ${row.value}
                        </div>`}
                    <div></div>
                  </div>`;
                })}
              </div>
            </div>
          `;
        }
      )}
    </div>
  `;
}

@customElement('affine-database')
// cannot find children in shadow dom
export class DatabaseBlock extends NonShadowLitElement {
  static styles = css`
    .affine-database-block-tag-circle {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
    }

    .affine-database-block-tag {
      display: inline-flex;
      border-radius: 11px;
      align-items: center;
      padding: 0 8px;
      cursor: pointer;
    }
  `;
  @property({
    hasChanged() {
      return true;
    },
  })
  model!: DatabaseBlockModel;
  @property()
  host!: BlockHost;

  get rows() {
    return this.model.children.map(block => {
      return this.model.columns.map(type => {
        return this.host.page.getBlockTagByType(block, type);
      });
    });
  }

  firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
    console.log('blockTags', this.rows);
  }

  protected render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    return html`
      <div style="border: 1px solid;">
        <div class="affine-database-block-header">database header</div>
        ${DataBaseRowContainer(this)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database': DatabaseBlock;
  }
}
