// related component
import './components/add-column-type-popup.js';
import './components/cell-container.js';

import type { ColumnSchema } from '@blocksuite/global/database';
import { assertEquals } from '@blocksuite/global/utils';
import { VEditor } from '@blocksuite/virgo';
import { createPopper } from '@popperjs/core';
import { css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html, unsafeStatic } from 'lit/static-html.js';

import { type BlockHost } from '../__internal__/index.js';
import { BlockElementWithService } from '../__internal__/service/components.js';
import { NonShadowLitElement } from '../__internal__/utils/lit.js';
import type { DatabaseAddColumnTypePopup } from './components/add-column-type-popup.js';
import { DATABASE_ADD_COLUMN_TYPE_POPUP } from './components/add-column-type-popup.js';
import { registerInternalRenderer } from './components/column-type/index.js';
import { EditColumnPopup } from './components/edit-column-popup.js';
import type { DatabaseBlockModel } from './database-model.js';
import { DatabaseBlockDisplayMode } from './database-model.js';
import { getColumnSchemaRenderer } from './register.js';
import { onClickOutside } from './utils.js';

const FIRST_LINE_TEXT_WIDTH = 200;
const ADD_COLUMN_BUTTON_WIDTH = 33;

let once = true;
if (once) {
  registerInternalRenderer();
  once = false;
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
      ></div>
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
                editColumn.targetColumnSchema = column;
                document.body.appendChild(editColumn);
                requestAnimationFrame(() => {
                  createPopper(event.target as Element, editColumn, {
                    placement: 'bottom',
                  });
                  onClickOutside(editColumn, ele => ele.remove(), 'mousedown');
                });
              }}
            >
              ${column.name}
            </div>
          `;
        }
      )}
      <div
        class="affine-database-block-add-column-button"
        data-test-id="affine-database-add-column-button"
        @click=${() => {
          block.addColumnTypePopup.show = true;
        }}
      >
        <svg
          viewBox="0 0 16 16"
          style=${styleMap({
            width: '12px',
            height: '100%',
            fill: 'var(--affine-text-color)',
          })}
        >
          <path
            d="M7.977 14.963c.407 0 .747-.324.747-.723V8.72h5.362c.399 0 .74-.34.74-.747a.746.746 0 00-.74-.738H8.724V1.706c0-.398-.34-.722-.747-.722a.732.732 0 00-.739.722v5.529h-5.37a.746.746 0 00-.74.738c0 .407.341.747.74.747h5.37v5.52c0 .399.332.723.739.723z"
          ></path>
        </svg>
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
        display: flex;
        align-items: center;
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
          const databaseHost = { ...host, flavour: 'affine:database' };
          // Note that the prototype will be lost here, causing `host.page` to not be found
          // So, we restore its prototype manually
          Object.setPrototypeOf(databaseHost, Object.getPrototypeOf(host));
          return html`
            <div class="affine-database-block-row" data-row-id="${idx}">
              <div
                style=${styleMap({
                  minWidth: `${FIRST_LINE_TEXT_WIDTH}px`,
                  maxWidth: `${FIRST_LINE_TEXT_WIDTH}px`,
                })}
              >
                ${BlockElementWithService(child, databaseHost, () => {
                  databaseBlock.requestUpdate();
                })}
              </div>
              ${repeat(databaseBlock.columns, column => {
                return html`
                  <affine-database-cell-container
                    .databaseModel=${databaseModel}
                    .rowModel=${child}
                    .columnSchema=${column}
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

    .affine-database-block-title:focus {
      outline: none;
    }

    .affine-database-block-title:disabled {
      background-color: transparent;
    }

    .affine-database-block-title-empty::before {
      content: 'Database';
      color: var(--affine-placeholder-color);
      position: absolute;
      opacity: 0.5;
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

    .affine-database-block-add-column-button {
      width: ${ADD_COLUMN_BUTTON_WIDTH}px;
      height: ${ADD_COLUMN_BUTTON_WIDTH}px;

      display: flex;
      align-items: center;
      justify-content: center;
    }
  `;

  @property()
  model!: DatabaseBlockModel;

  @property()
  host!: BlockHost;

  @query(DATABASE_ADD_COLUMN_TYPE_POPUP)
  addColumnTypePopup!: DatabaseAddColumnTypePopup;

  private _vEditor: VEditor | null = null;

  @query('.affine-database-block-title')
  private _container!: HTMLDivElement;

  get columns(): ColumnSchema[] {
    return this.model.columns.map(id =>
      this.model.page.getColumnSchema(id)
    ) as ColumnSchema[];
  }

  private _addRow = () => {
    this.model.page.captureSync();
    this.model.page.addBlock('affine:paragraph', {}, this.model.id);
  };

  private _addColumn = (columnType: ColumnSchema['type']) => {
    this.model.page.captureSync();
    const renderer = getColumnSchemaRenderer(columnType);
    const schema: Omit<ColumnSchema, 'id'> = {
      type: columnType,
      name: 'new column',
      internalProperty: {
        width: 200,
        hide: false,
        color: '#000',
      },
      property: renderer.propertyCreator(),
    };
    const id = this.model.page.setColumnSchema(schema);
    this.model.page.updateBlock(this.model, {
      columns: [...this.model.columns, id],
    });
  };

  private _initTitleVEditor() {
    this._vEditor = new VEditor(this.model.title.yText);
    this._vEditor.mount(this._container);
    this._vEditor.setReadonly(this.model.page.readonly);

    // for title placeholder
    this.model.title.yText.observe(() => {
      this.requestUpdate();
    });

    // after the database structure is created
    requestAnimationFrame(() => {
      this._vEditor?.focusEnd();
    });
  }

  firstUpdated() {
    this._initTitleVEditor();

    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  /* eslint-disable lit/binding-positions, lit/no-invalid-html */
  render() {
    const totalWidth =
      this.columns
        .map(column => column.internalProperty.width)
        .reduce((t, x) => t + x, 0) +
      FIRST_LINE_TEXT_WIDTH +
      ADD_COLUMN_BUTTON_WIDTH;

    const isEmpty = !this.model.title || !this.model.title.length;

    return html`
      <div class="affine-database-block-title ${
        isEmpty ? 'affine-database-block-title-empty' : ''
      }" data-block-is-title="true">
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
            <div class="affine-database-block-add-row"
                 data-test-id="affine-database-add-row-button"
                 role="button"
                 @click=${this._addRow}>
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
