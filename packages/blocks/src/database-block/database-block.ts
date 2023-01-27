import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import type { DatabaseBlockModel } from './database-model.js';
import { BlockElementWithService, BlockHost } from '../__internal__/index.js';
import { NonShadowLitElement } from '../__internal__/utils/lit.js';
import { repeat } from 'lit/directives/repeat.js';
import { assertEquals } from '@blocksuite/global/utils';
import { DatabaseBlockDisplayMode } from './database-model.js';
import { styleMap } from 'lit/directives/style-map.js';
import TagSchema = BlockSuiteInternal.TagSchema;
import { nanoid } from '@blocksuite/store';
import z from 'zod';
import { BLOCK_ID_ATTR } from '@blocksuite/global/config';

const columnPreviewSchema = z.object({
  type: z.enum(['text', 'rich-text', 'select', 'number']),
  name: z.string(),
});

type Preview = z.infer<typeof columnPreviewSchema>;

const preview: Preview[] = [
  {
    type: 'number',
    name: 'Number',
  },
  {
    type: 'select',
    name: 'Select',
  },
  {
    type: 'text',
    name: 'Single Line Text',
  },
  {
    type: 'rich-text',
    name: 'Rich Text',
  },
];

const FIRST_LINE_TEXT_WIDTH = 200;

function DatabaseHeader(block: DatabaseBlock) {
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
                minWidth: `${column.meta.width}px`,
                maxWidth: `${column.meta.width}px`,
              })}
            >
              ${column.name}
            </div>
          `;
        }
      )}
      <div
        class="affine-database-block-add-column"
        @click=${() => {
          block.settingsSidebar.show = true;
        }}
      >
        +
      </div>
    </div>
  `;
}

function DataBaseRowContainer(block: DatabaseBlock) {
  const model = block.model;
  const host = block.host;
  assertEquals(model.mode, DatabaseBlockDisplayMode.Database);

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
        model.children,
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
                  block.requestUpdate();
                })}
              </div>
              ${repeat(
                block.columns.map(
                  column =>
                    [
                      column,
                      child.page.getBlockTagByTagSchema(child, column),
                    ] as const
                ),
                ([column, tag]) => {
                  return html`
                    <div
                      style=${styleMap({
                        minWidth: `${column.meta.width}px`,
                        maxWidth: `${column.meta.width}px`,
                      })}
                    >
                      ${tag?.value ?? 'no value'}
                    </div>
                  `;
                }
              )}
            </div>
          `;
        }
      )}
    </div>
  `;
}

@customElement('affine-database-settings-sidebar')
export class DatabaseBlockSettingsSidebar extends LitElement {
  static styles = css`
    :host {
      position: absolute;
      right: 0;
      top: 0;
      display: flex;
      flex-direction: column;
      height: 100%;
      border-left: 1px solid rgb(233, 233, 231);
      background-color: var(--affine-page-background);
    }

    :host > * {
      padding-left: 14px;
    }

    .affine-database-settings-sidebar-subtitle {
      color: rgba(55, 53, 47, 0.65);
      padding-top: 14px;
      padding-bottom: 14px;
      font-size: 12px;
      font-weight: 500;
      line-height: 120%;
      user-select: none;
    }

    .affine-database-settings-sidebar-title {
      padding-top: 12px;
      font-size: 14px;
      font-weight: 600;
    }

    .affine-database-settings-sidebar-list {
      font-size: 14px;
    }

    .affine-database-settings-sidebar-list > div {
      min-height: 28px;
    }
  `;

  @property()
  show = false;

  @property()
  onSelectType!: (type: TagSchema['type']) => void;

  private _handleSelectType = (e: MouseEvent) => {
    if (e.target instanceof HTMLElement) {
      const type = e.target.getAttribute('data-type');
      this.onSelectType(type as TagSchema['type']);
    }
  };

  private _handleClose = () => {
    this.show = false;
  };

  private _handleClickAway = (event: MouseEvent) => {
    if (this.contains(event.target as Node)) {
      return;
    }
    this._handleClose();
  };

  protected update(changedProperties: Map<string, unknown>) {
    super.update(changedProperties);
    if (changedProperties.has('show')) {
      if (this.show) {
        this.style.minWidth = `290px`;
        this.style.maxWidth = `290px`;
        setTimeout(() =>
          document.addEventListener('click', this._handleClickAway)
        );
      } else {
        this.style.minWidth = '0';
        this.style.maxWidth = `0`;
        document.removeEventListener('click', this._handleClickAway);
      }
    }
  }

  protected render() {
    if (!this.show) {
      return null;
    }
    return html`
      <div class="affine-database-settings-sidebar-title">
        New column
        <button @click=${this._handleClose}>X</button>
      </div>
      <div class="affine-database-settings-sidebar-subtitle">Type</div>
      <div class="affine-database-settings-sidebar-list">
        ${repeat(
          preview,
          preview =>
            html`
              <div data-type="${preview.type}" @click=${this._handleSelectType}>
                ${preview.name}
              </div>
            `
        )}
      </div>
    `;
  }
}

@customElement('affine-database')
export class DatabaseBlock extends NonShadowLitElement {
  static styles = css`
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

  @query('affine-database-settings-sidebar')
  settingsSidebar!: DatabaseBlockSettingsSidebar;

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
    // @ts-expect-error
    const column: TagSchema = {
      id: nanoid(),
      type: columnType,
      name: columnType,
      meta: {
        color: '#ff0000',
        hide: false,
        width: 200,
      },
    };
    this.model.page.setTagSchema(column);
    this.model.page.updateBlock(this.model, {
      columns: [...this.model.columns, column.id],
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

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
    const totalWidth =
      this.columns.map(column => column.meta.width).reduce((t, x) => t + x, 0) +
      FIRST_LINE_TEXT_WIDTH;

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
      <affine-database-settings-sidebar
        .onSelectType=${this._addColumn}
      ></affine-database-settings-sidebar>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database': DatabaseBlock;
    'affine-database-settings-sidebar': DatabaseBlockSettingsSidebar;
  }
}
