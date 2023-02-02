// related component
import './components/add-column-type-popup.js';

import { css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import type { DatabaseBlockModel } from './database-model.js';
import { BlockElementWithService, BlockHost } from '../__internal__/index.js';
import { NonShadowLitElement } from '../__internal__/utils/lit.js';
import { repeat } from 'lit/directives/repeat.js';
import { assertEquals } from '@blocksuite/global/utils';
import { DatabaseBlockDisplayMode } from './database-model.js';
import { styleMap } from 'lit/directives/style-map.js';
import { BLOCK_ID_ATTR } from '@blocksuite/global/config';
import { EditColumnPopup } from './components/edit-column-popup.js';
import { createPopper } from '@popperjs/core';
import { registerInternalRenderer } from './components/column-type/index.js';
import type { DatabaseAddColumnTypePopup } from './components/add-column-type-popup.js';
import type { TagSchema } from '@blocksuite/global/database';
import { html, unsafeStatic } from 'lit/static-html.js';
import './components/cell-container.js';
import { getTagSchemaRenderer } from './register.js';
import { nanoid } from '@blocksuite/store';
import { DATABASE_ADD_COLUMN_TYPE_POPUP } from './components/add-column-type-popup.js';

const FIRST_LINE_TEXT_WIDTH = 200;

let once = true;
if (once) {
  registerInternalRenderer();
  once = false;
}

const isVisible = (elem: HTMLElement) =>
  !!elem &&
  !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length); // source (2018-03-11): https://github.com/jquery/jquery/blob/master/src/css/hiddenVisibleSelectors.js
function hideOnClickOutside(element: HTMLElement) {
  const outsideClickListener = (event: MouseEvent) => {
    if (!element.contains(event.target as Node) && isVisible(element)) {
      // or use: event.target.closest(selector) === null
      element.remove();
      removeClickListener();
    }
  };

  const removeClickListener = () => {
    document.removeEventListener('click', outsideClickListener);
  };

  document.addEventListener('click', outsideClickListener);
}

function DatabaseHeader(block: DatabaseBlockComponent) {
  return html`
    <div class="affine-database-block-header">
      <div
        class="affine-database-block-column"
        data-column-id="-1"
        style=${styleMap({
          minWidth: `${FIRST_LINE_TEXT_WIDTH}px`,
          maxWidth: `${FIRST_LINE_TEXT_WIDTH}px`,
        })}
      >
        Name
      </div>
      ${repeat(
        block.columns,
        column => column.id,
        column => {
          return html`
            <div
              class="affine-database-block-column"
              data-column-id="${column.id}"
              style=${styleMap({
                minWidth: `${column.internalProperty.width}px`,
                maxWidth: `${column.internalProperty.width}px`,
              })}
              @click=${(event: MouseEvent) => {
                const editColumn = new EditColumnPopup();
                editColumn.targetModel = block.model;
                editColumn.targetTagSchema = column;
                document.body.appendChild(editColumn);
                requestAnimationFrame(() => {
                  createPopper(event.target as Element, editColumn, {
                    placement: 'bottom',
                  });
                  hideOnClickOutside(editColumn);
                });
              }}
            >
              ${column.name}
            </div>
          `;
        }
      )}
      <div
        class="affine-database-block-add-column"
        @click=${() => {
          block.addColumnTypePopup.show = true;
        }}
      >
        +
      </div>
    </div>
  `;
}

function DataBaseRowContainer(databaseBlock: DatabaseBlockComponent) {
  const databaseModel = databaseBlock.model;
  const host = databaseBlock.host;
  assertEquals(databaseModel.mode, DatabaseBlockDisplayMode.Database);

  return html`
    <style>
      .affine-database-block-header {
        display: flex;
        flex-direction: row;
      }

      .affine-database-block-column {
        transition: background 20ms ease-in 0s;
      }

      .affine-database-block-column:hover {
        background: rgba(55, 53, 47, 0.08);
      }

      .affine-database-block-rows {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
      }

      .affine-database-block-row {
        width: 100%;
        display: flex;
        flex-direction: row;
        border-top: 1px solid rgb(238, 238, 237);
      }
    </style>
    <div class="affine-database-block-rows">
      ${repeat(
        databaseModel.children,
        child => child.id,
        (child, idx) => {
          return html`
            <div class="affine-database-block-row" data-row-id="${idx}">
              <div
                style=${styleMap({
                  minWidth: `${FIRST_LINE_TEXT_WIDTH}px`,
                  maxWidth: `${FIRST_LINE_TEXT_WIDTH}px`,
                })}
              >
                ${BlockElementWithService(child, host, () => {
                  databaseBlock.requestUpdate();
                })}
              </div>
              ${repeat(databaseBlock.columns, column => {
                return html`
                  <affine-database-cell-container
                    .databaseModel=${databaseModel}
                    .rowModel=${child}
                    .column=${column}
                  >
                  </affine-database-cell-container>
                `;
              })}
            </div>
          `;
        }
      )}
    </div>
  `;
}

@customElement('affine-database')
export class DatabaseBlockComponent extends NonShadowLitElement {
  static styles = css`
    affine-database {
      position: relative;
    }

    .affine-database-block {
      position: relative;
      width: 100%;
      overflow-x: scroll;
      border-top: 1px solid rgb(238, 238, 237);
      border-bottom: 1px solid rgb(238, 238, 237);
    }

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

    .affine-database-block-title {
      position: sticky;
      width: 100%;
      min-height: 1em;
      height: 40px;
      font-size: 22px;
      font-weight: 700;
      border: 0;
      font-family: inherit;
      color: inherit;
    }

    .affine-database-block-title::placeholder {
      color: var(--affine-placeholder-color);
    }

    .affine-database-block-title:disabled {
      background-color: transparent;
    }

    .affine-database-block-footer {
      border-top: 1px solid rgb(238, 238, 237);
    }

    .affine-database-block-add-row {
      user-select: none;
      transition: background 20ms ease-in 0s;
      cursor: pointer;
      display: flex;
      align-items: center;
      height: 32px;
      width: 100%;
      padding-left: 8px;
      font-size: 14px;
      line-height: 20px;
      border-top: 1px solid rgb(233, 233, 231);
    }
  `;

  @property({ hasChanged: () => true })
  model!: DatabaseBlockModel;

  @property()
  host!: BlockHost;

  @query(DATABASE_ADD_COLUMN_TYPE_POPUP)
  addColumnTypePopup!: DatabaseAddColumnTypePopup;

  get columns(): TagSchema[] {
    return this.model.columns.map(id =>
      this.model.page.getTagSchema(id)
    ) as TagSchema[];
  }

  private _addRow = () => {
    this.model.page.captureSync();
    this.model.page.addBlockByFlavour('affine:paragraph', {}, this.model.id);
  };

  private _addColumn = (columnType: TagSchema['type']) => {
    this.model.page.captureSync();
    const renderer = getTagSchemaRenderer(columnType);
    const schema: TagSchema = {
      id: nanoid(),
      type: columnType,
      name: 'new column',
      internalProperty: {
        width: 200,
        hide: false,
        color: '#000',
      },
      property: renderer.propertyCreator(),
    };
    this.model.page.setTagSchema(schema);
    this.model.page.updateBlock(this.model, {
      columns: [...this.model.columns, schema.id],
    });
  };

  firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  private _onTitleInput = (e: InputEvent) => {
    const value = (e.target as HTMLInputElement).value;
    this.model.page.updateBlock(this.model, {
      title: value,
    });
  };

  /* eslint-disable lit/binding-positions, lit/no-invalid-html */
  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
    const totalWidth =
      this.columns
        .map(column => column.internalProperty.width)
        .reduce((t, x) => t + x, 0) + FIRST_LINE_TEXT_WIDTH;

    return html`
      <div>
        <input
          class="affine-database-block-title"
          data-block-is-title="true"
          .value=${this.model.title}
          placeholder="Database"
          @input=${this._onTitleInput}
        />
      </div>
      <div class="affine-database-block">
        <div
          class="affine-database-block-container"
          style=${styleMap({
            width: `${totalWidth}px`,
          })}
        >
          ${DatabaseHeader(this)} ${DataBaseRowContainer(this)}
          <div class="affine-database-block-footer">
            <div class="affine-database-block-add-row" @click=${this._addRow}>
              + New
            </div>
          </div>
        </div>
      </div>
      <${unsafeStatic(DATABASE_ADD_COLUMN_TYPE_POPUP)}
        .onSelectType=${this._addColumn}
      ></${unsafeStatic(DATABASE_ADD_COLUMN_TYPE_POPUP)}>
    `;
  }
  /* eslint-enable lit/binding-positions, lit/no-invalid-html */
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database': DatabaseBlockComponent;
  }
}
