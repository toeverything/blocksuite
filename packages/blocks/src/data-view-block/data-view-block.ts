import { CaptionedBlockComponent } from '@blocksuite/affine-components/caption';
import { popMenu } from '@blocksuite/affine-components/context-menu';
import {
  CopyIcon,
  DeleteIcon,
  MoreHorizontalIcon,
} from '@blocksuite/affine-components/icons';
import { PeekViewProvider } from '@blocksuite/affine-components/peek';
import { RANGE_SYNC_EXCLUDE_ATTR } from '@blocksuite/block-std';
import {
  createRecordDetail,
  createUniComponentFromWebComponent,
  DatabaseSelection,
  type DataSource,
  DataView,
  dataViewCommonStyle,
  type DataViewProps,
  type DataViewSelection,
  type DataViewWidget,
  type DataViewWidgetProps,
  defineUniComponent,
  renderUniLit,
  uniMap,
} from '@blocksuite/data-view';
import { widgetPresets } from '@blocksuite/data-view/widget-presets';
import { Slice } from '@blocksuite/store';
import { computed, signal } from '@preact/signals-core';
import { css, nothing, unsafeCSS } from 'lit';
import { html } from 'lit/static-html.js';

import type { NoteBlockComponent } from '../note-block/index.js';
import type { DataViewBlockModel } from './data-view-model.js';

import { BlockRenderer } from '../database-block/detail-panel/block-renderer.js';
import { NoteRenderer } from '../database-block/detail-panel/note-renderer.js';
import {
  EdgelessRootBlockComponent,
  type RootService,
} from '../root-block/index.js';
import { BlockQueryDataSource } from './data-source.js';

export class DataViewBlockComponent extends CaptionedBlockComponent<DataViewBlockModel> {
  static override styles = css`
    ${unsafeCSS(dataViewCommonStyle('affine-database'))}
    affine-database {
      display: block;
      border-radius: 8px;
      background-color: var(--affine-background-primary-color);
      padding: 8px;
      margin: 8px -8px -8px;
    }

    .database-block-selected {
      background-color: var(--affine-hover-color);
      border-radius: 4px;
    }

    .database-ops {
      margin-top: 4px;
      padding: 2px;
      border-radius: 4px;
      display: flex;
      cursor: pointer;
    }

    .database-ops svg {
      width: 16px;
      height: 16px;
      color: var(--affine-icon-color);
    }

    .database-ops:hover {
      background-color: var(--affine-hover-color);
    }

    @media print {
      .database-ops {
        display: none;
      }

      .database-header-bar {
        display: none !important;
      }
    }
  `;

  private _clickDatabaseOps = (e: MouseEvent) => {
    popMenu(e.currentTarget as HTMLElement, {
      options: {
        input: {
          initValue: this.model.title,
          placeholder: 'Untitled',
          onComplete: text => {
            this.model.title = text;
          },
        },
        items: [
          {
            type: 'action',
            icon: CopyIcon,
            name: 'Copy',
            select: () => {
              const slice = Slice.fromModels(this.doc, [this.model]);
              this.std.clipboard.copySlice(slice).catch(console.error);
            },
          },
          // {
          //   type: 'action',
          //   icon: DuplicateIcon,
          //   name: 'Duplicate',
          //   select: () => {
          //   },
          // },
          {
            type: 'group',
            name: '',
            children: () => [
              {
                type: 'action',
                icon: DeleteIcon,
                class: 'delete-item',
                name: 'Delete Database',
                select: () => {
                  this.model.children.slice().forEach(block => {
                    this.doc.deleteBlock(block);
                  });
                  this.doc.deleteBlock(this.model);
                },
              },
            ],
          },
        ],
      },
    });
  };

  private _dataSource?: DataSource;

  private dataView = new DataView();

  _bindHotkey: DataViewProps['bindHotkey'] = hotkeys => {
    return {
      dispose: this.host.event.bindHotkey(hotkeys, {
        blockId: this.topContenteditableElement?.blockId ?? this.blockId,
      }),
    };
  };

  _handleEvent: DataViewProps['handleEvent'] = (name, handler) => {
    return {
      dispose: this.host.event.add(name, handler, {
        blockId: this.blockId,
      }),
    };
  };

  getRootService = () => {
    return this.std.getService<RootService>('affine:page');
  };

  headerWidget: DataViewWidget = defineUniComponent(
    (props: DataViewWidgetProps) => {
      return html`
        <div style="margin-bottom: 16px;display:flex;flex-direction: column">
          <div style="display:flex;gap:8px;padding: 0 6px;margin-bottom: 8px;">
            <div>${this.model.title}</div>
            ${this.renderDatabaseOps()}
          </div>
          <div
            style="display:flex;align-items:center;justify-content: space-between;gap: 12px"
            class="database-header-bar"
          >
            <div style="flex:1">
              ${renderUniLit(widgetPresets.viewBar, props)}
            </div>
            ${renderUniLit(this.toolsWidget, props)}
          </div>
          ${renderUniLit(widgetPresets.filterBar, props)}
        </div>
      `;
    }
  );

  selection$ = computed(() => {
    const databaseSelection = this.selection.value.find(
      (selection): selection is DatabaseSelection => {
        if (selection.blockId !== this.blockId) {
          return false;
        }
        return selection instanceof DatabaseSelection;
      }
    );
    return databaseSelection?.viewSelection;
  });

  setSelection = (selection: DataViewSelection | undefined) => {
    this.selection.setGroup(
      'note',
      selection
        ? [
            new DatabaseSelection({
              blockId: this.blockId,
              viewSelection: selection,
            }),
          ]
        : []
    );
  };

  toolsWidget: DataViewWidget = widgetPresets.createTools({
    table: [
      widgetPresets.tools.filter,
      widgetPresets.tools.search,
      widgetPresets.tools.viewOptions,
      widgetPresets.tools.tableAddRow,
    ],
    kanban: [
      widgetPresets.tools.filter,
      widgetPresets.tools.search,
      widgetPresets.tools.viewOptions,
    ],
  });

  get dataSource(): DataSource {
    if (!this._dataSource) {
      this._dataSource = new BlockQueryDataSource(this.host, this.model, {
        type: 'todo',
      });
    }
    return this._dataSource;
  }

  override get topContenteditableElement() {
    if (this.rootComponent instanceof EdgelessRootBlockComponent) {
      const note = this.closest<NoteBlockComponent>('affine-note');
      return note;
    }
    return this.rootComponent;
  }

  get view() {
    return this.dataView.expose;
  }

  private renderDatabaseOps() {
    if (this.doc.readonly) {
      return nothing;
    }
    return html` <div class="database-ops" @click="${this._clickDatabaseOps}">
      ${MoreHorizontalIcon}
    </div>`;
  }

  override connectedCallback() {
    super.connectedCallback();

    this.setAttribute(RANGE_SYNC_EXCLUDE_ATTR, 'true');
  }

  override renderBlock() {
    const peekViewService = this.std.getOptional(PeekViewProvider);
    return html`
      <div contenteditable="false" style="position: relative">
        ${this.dataView.render({
          virtualPadding$: signal(0),
          bindHotkey: this._bindHotkey,
          handleEvent: this._handleEvent,
          selection$: this.selection$,
          setSelection: this.setSelection,
          dataSource: this.dataSource,
          headerWidget: this.headerWidget,
          std: this.std,
          detailPanelConfig: {
            openDetailPanel: (target, data) => {
              if (peekViewService) {
                const template = createRecordDetail({
                  ...data,
                  detail: {
                    header: uniMap(
                      createUniComponentFromWebComponent(BlockRenderer),
                      props => ({
                        ...props,
                        host: this.host,
                      })
                    ),
                    note: uniMap(
                      createUniComponentFromWebComponent(NoteRenderer),
                      props => ({
                        ...props,
                        model: this.model,
                        host: this.host,
                      })
                    ),
                  },
                });
                return peekViewService.peek(target, template);
              } else {
                return Promise.resolve();
              }
            },
          },
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view': DataViewBlockComponent;
  }
}
