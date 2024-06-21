import { RangeManager } from '@blocksuite/block-std';
import { Slice, Slot } from '@blocksuite/store';
import { css, nothing, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import { BlockComponent, popMenu } from '../_common/components/index.js';
import {
  CopyIcon,
  DeleteIcon,
  MoreHorizontalIcon,
} from '../_common/icons/index.js';
import { dataViewCommonStyle } from '../database-block/data-view/common/css-variable.js';
import type { DataSource } from '../database-block/data-view/common/data-source/base.js';
import {
  DatabaseSelection,
  DataView,
  type DataViewProps,
  type DataViewSelection,
  type DataViewWidget,
  type DataViewWidgetProps,
  defineUniComponent,
  renderUniLit,
  type ViewSource,
  widgetPresets,
} from '../database-block/data-view/index.js';
import type { NoteBlockComponent } from '../note-block/index.js';
import {
  type AffineInnerModalWidget,
  EdgelessRootBlockComponent,
} from '../root-block/index.js';
import { AFFINE_INNER_MODAL_WIDGET } from '../root-block/widgets/inner-modal/inner-modal.js';
import { BlockQueryDataSource } from './data-source.js';
import type { DataViewBlockModel } from './data-view-model.js';
import { BlockQueryViewSource } from './view-source.js';

@customElement('affine-data-view')
export class DataViewBlockComponent extends BlockComponent<DataViewBlockModel> {
  override get topContenteditableElement() {
    if (this.rootElement instanceof EdgelessRootBlockComponent) {
      const note = this.closest<NoteBlockComponent>('affine-note');
      return note;
    }
    return this.rootElement;
  }

  get view() {
    return this.dataView.expose;
  }

  get dataSource(): DataSource {
    if (!this._dataSource) {
      this._dataSource = new BlockQueryDataSource(this.host, this.model, {
        type: 'todo',
      });
    }
    return this._dataSource;
  }

  get viewSource(): ViewSource {
    if (!this._viewSource) {
      this._viewSource = new BlockQueryViewSource(this.model);
    }
    return this._viewSource;
  }

  get getFlag() {
    return this.host.doc.awarenessStore.getFlag.bind(
      this.host.doc.awarenessStore
    );
  }

  get innerModalWidget() {
    return this.rootElement?.widgetElements[
      AFFINE_INNER_MODAL_WIDGET
    ] as AffineInnerModalWidget;
  }

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
  `;

  private dataView = new DataView();

  private _dataSource?: DataSource;

  private _viewSource?: ViewSource;

  toolsWidget: DataViewWidget = widgetPresets.createTools({
    table: [
      widgetPresets.tools.filter,
      widgetPresets.tools.expand,
      widgetPresets.tools.search,
      widgetPresets.tools.viewOptions,
      widgetPresets.tools.tableAddRow,
    ],
    kanban: [
      widgetPresets.tools.filter,
      widgetPresets.tools.expand,
      widgetPresets.tools.search,
      widgetPresets.tools.viewOptions,
    ],
  });

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

  selectionUpdated = new Slot<DataViewSelection | undefined>();

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

    this.setAttribute(RangeManager.rangeSyncExcludeAttr, 'true');

    this._disposables.add(
      this.selection.slots.changed.on(selections => {
        const databaseSelection = selections.find(
          (selection): selection is DatabaseSelection => {
            if (selection.blockId !== this.blockId) {
              return false;
            }
            return selection instanceof DatabaseSelection;
          }
        );
        this.selectionUpdated.emit(databaseSelection?.viewSelection);
      })
    );
    this._disposables.add(
      this.model.propsUpdated.on(data => {
        if (data.key === 'views') {
          this.viewSource.checkViewDataUpdate();
        }
      })
    );
  }

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

  _bindHotkey: DataViewProps['bindHotkey'] = hotkeys => {
    return {
      dispose: this.host.event.bindHotkey(hotkeys, {
        path: this.topContenteditableElement?.path ?? this.path,
      }),
    };
  };

  _handleEvent: DataViewProps['handleEvent'] = (name, handler) => {
    return {
      dispose: this.host.event.add(name, handler, {
        path: this.path,
      }),
    };
  };

  getRootService = () => {
    return this.std.spec.getService('affine:page');
  };

  override renderBlock() {
    const peekViewService = this.getRootService().peekViewService;
    return html`
      <div contenteditable="false" style="position: relative">
        ${this.dataView.render({
          bindHotkey: this._bindHotkey,
          handleEvent: this._handleEvent,
          getFlag: this.getFlag,
          selectionUpdated: this.selectionUpdated,
          setSelection: this.setSelection,
          dataSource: this.dataSource,
          viewSource: this.viewSource,
          headerWidget: this.headerWidget,
          std: this.std,
          detailPanelConfig: {
            openDetailPanel: peekViewService
              ? async (target, template) =>
                  peekViewService.peek(target, template)
              : undefined,
            target: () => this.innerModalWidget.target,
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
