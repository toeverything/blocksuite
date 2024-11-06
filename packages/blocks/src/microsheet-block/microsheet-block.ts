import type { MicrosheetBlockModel } from '@blocksuite/affine-model';
import type { DataViewTable } from '@blocksuite/microsheet-data-view/view-presets';

import { CaptionedBlockComponent } from '@blocksuite/affine-components/caption';
import {
  menu,
  popMenu,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import { DragIndicator } from '@blocksuite/affine-components/drag-indicator';
import { PeekViewProvider } from '@blocksuite/affine-components/peek';
import { toast } from '@blocksuite/affine-components/toast';
import { NOTE_SELECTOR } from '@blocksuite/affine-shared/consts';
import { Rect, Slot } from '@blocksuite/global/utils';
import {
  CopyIcon,
  DeleteIcon,
  MoreHorizontalIcon,
} from '@blocksuite/icons/lit';
import {
  createRecordDetail,
  createUniComponentFromWebComponent,
  DataView,
  dataViewCommonStyle,
  type DataViewExpose,
  type DataViewProps,
  type DataViewSelection,
  type DataViewWidget,
  type DataViewWidgetProps,
  defineUniComponent,
  MicrosheetSelection,
  renderUniLit,
  uniMap,
} from '@blocksuite/microsheet-data-view';
import { widgetPresets } from '@blocksuite/microsheet-data-view/widget-presets';
import { Slice } from '@blocksuite/store';
import { computed, signal } from '@preact/signals-core';
import { css, html, nothing, unsafeCSS } from 'lit';
import { query } from 'lit/decorators.js';

import type { NoteBlockComponent } from '../note-block/index.js';
import type { MicrosheetOptionsConfig } from './config.js';
import type { MicrosheetBlockService } from './microsheet-service.js';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { TableRowSelection } from '../../../affine/data-view/src/view-presets/table/types.js';
import {
  EdgelessRootBlockComponent,
  type RootService,
} from '../root-block/index.js';
import { getDropResult } from '../root-block/widgets/drag-handle/utils.js';
import { popSideDetail } from './components/layout.js';
import { HostContextKey } from './context/host-context.js';
import { MicrosheetBlockDataSource } from './data-source.js';
import { BlockRenderer } from './detail-panel/block-renderer.js';
import { NoteRenderer } from './detail-panel/note-renderer.js';
import { calculateLineNum, isInCellEnd, isInCellStart } from './utils.js';

export class MicrosheetBlockComponent extends CaptionedBlockComponent<
  MicrosheetBlockModel,
  MicrosheetBlockService
> {
  static override styles = css`
    ${unsafeCSS(dataViewCommonStyle('affine-microsheet'))}
    affine-microsheet {
      display: block;
      background-color: var(--affine-background-primary-color);
    }

    affine-microsheet:hover .affine-microsheet-column-header {
      visibility: visible;
    }

    affine-microsheet:hover .microsheet-data-view-table-left-bar {
      visibility: visible;
    }
    affine-microsheet:hover .data-view-table-left-bar {
      visibility: visible;
    }

    affine-microsheet affine-paragraph .affine-block-component {
      // margin: 0 !important;
    }

    .microsheet-block-selected {
      background-color: var(--affine-hover-color);
      border-radius: 4px;
    }

    .microsheet-ops {
      margin-top: 4px;
      padding: 2px;
      border-radius: 4px;
      display: flex;
      cursor: pointer;
    }

    .microsheet-ops svg {
      width: 16px;
      height: 16px;
      color: var(--affine-icon-color);
    }

    .microsheet-ops:hover {
      background-color: var(--affine-hover-color);
    }

    @media print {
      .microsheet-ops {
        display: none;
      }

      .microsheet-header-bar {
        display: none !important;
      }
    }
  `;

  private _clickMicrosheetOps = (e: MouseEvent) => {
    const options = this.optionsConfig.configure(this.model, {
      items: [
        menu.input({
          initialValue: this.model.title.toString(),
          placeholder: 'Untitled',
          onComplete: text => {
            this.model.title.replace(0, this.model.title.length, text);
          },
        }),
        menu.action({
          prefix: CopyIcon(),
          name: 'Copy',
          select: () => {
            const slice = Slice.fromModels(this.doc, [this.model]);
            this.std.clipboard
              .copySlice(slice)
              .then(() => {
                toast(this.host, 'Copied to clipboard');
              })
              .catch(console.error);
          },
        }),
        menu.group({
          items: [
            menu.action({
              prefix: DeleteIcon(),
              class: 'delete-item',
              name: 'Delete Microsheet',
              select: () => {
                this.model.children.slice().forEach(block => {
                  this.doc.deleteBlock(block);
                });
                this.doc.deleteBlock(this.model);
              },
            }),
          ],
        }),
      ],
    });

    popMenu(popupTargetFromElement(e.currentTarget as HTMLElement), {
      options,
    });
  };

  private _dataSource?: MicrosheetBlockDataSource;

  private dataView = new DataView();

  private renderTitle = (dataViewMethod: DataViewExpose) => {
    const addRow = () => dataViewMethod.addRow?.('start');
    return html` <affine-microsheet-title
      style="overflow: hidden"
      .titleText="${this.model.title}"
      .readonly="${this.doc.readonly}"
      .onPressEnterKey="${addRow}"
    ></affine-microsheet-title>`;
  };

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
            ${this.renderTitle(props.viewMethods)} ${this.renderMicrosheetOps()}
          </div>
          <div
            style="display:flex;align-items:center;justify-content: space-between;gap: 12px"
            class="microsheet-header-bar"
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

  indicator = new DragIndicator();

  onDrag = (evt: MouseEvent, id: string): (() => void) => {
    const result = getDropResult(evt);
    if (result && result.rect) {
      document.body.append(this.indicator);
      this.indicator.rect = Rect.fromLWTH(
        result.rect.left,
        result.rect.width,
        result.rect.top,
        result.rect.height
      );
      return () => {
        this.indicator.remove();
        const model = this.doc.getBlock(id)?.model;
        const target = this.doc.getBlock(result.dropBlockId)?.model ?? null;
        let parent = this.doc.getParent(result.dropBlockId);
        const shouldInsertIn = result.dropType === 'in';
        if (shouldInsertIn) {
          parent = target;
        }
        if (model && target && parent) {
          if (shouldInsertIn) {
            this.doc.moveBlocks([model], parent);
          } else {
            this.doc.moveBlocks(
              [model],
              parent,
              target,
              result.dropType === 'before'
            );
          }
        }
      };
    }
    this.indicator.remove();
    return () => {};
  };

  selectionUpdated = new Slot<DataViewSelection | undefined>();

  setSelection = (selection: DataViewSelection | undefined) => {
    this.selection.setGroup(
      'note',
      selection
        ? [
            new MicrosheetSelection({
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

  viewSelection$ = computed(() => {
    const microsheetSelection = this.selection.value.find(
      (selection): selection is MicrosheetSelection => {
        if (selection.blockId !== this.blockId) {
          return false;
        }
        return selection instanceof MicrosheetSelection;
      }
    );
    return microsheetSelection?.viewSelection;
  });

  virtualPadding$ = signal(0);

  get dataSource(): MicrosheetBlockDataSource {
    if (!this._dataSource) {
      this._dataSource = new MicrosheetBlockDataSource(this.model);
      this._dataSource.contextSet(HostContextKey, this.host);
    }
    return this._dataSource;
  }

  get dataViewTableElement() {
    return this._DataViewTableElement;
  }

  get optionsConfig(): MicrosheetOptionsConfig {
    return {
      configure: (_model, options) => options,
      ...this.std.getConfig('affine:page')?.microsheetOptions,
    };
  }

  override get topContenteditableElement() {
    if (this.rootComponent instanceof EdgelessRootBlockComponent) {
      const note = this.closest<NoteBlockComponent>(NOTE_SELECTOR);
      return note;
    }
    return this.rootComponent;
  }

  get view() {
    return this.dataView.expose;
  }

  private renderMicrosheetOps() {
    if (this.doc.readonly) {
      return nothing;
    }
    return html` <div
      class="microsheet-ops"
      @click="${this._clickMicrosheetOps}"
    >
      ${MoreHorizontalIcon()}
    </div>`;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.bindHotKey({
        Backspace: () => {
          const selectionController =
            this.dataViewTableElement?.selectionController;
          const selection = selectionController?.selection;
          if (!selectionController || !selection) return;
          const data = this.dataSource;
          if (TableRowSelection.is(selection)) {
            const rows = TableRowSelection.rowsIds(selection);
            selectionController.selection = undefined;
            rows.forEach(rowId => {
              this.model.columns.forEach(column => {
                if (rowId && column.id) {
                  data.refContentDelete(rowId, column.id);
                }
              });
            });
            return;
          }
          const {
            focus,
            rowsSelection,
            columnsSelection,
            isEditing,
            groupKey,
          } = selection;
          if (focus && !isEditing) {
            if (rowsSelection && columnsSelection) {
              // multi cell
              for (let i = rowsSelection.start; i <= rowsSelection.end; i++) {
                const { start, end } = columnsSelection;
                for (let j = start; j <= end; j++) {
                  const container = selectionController.getCellContainer(
                    groupKey,
                    i,
                    j
                  );
                  const rowId = container?.dataset.rowId;
                  const columnId = container?.dataset.columnId;
                  if (rowId && columnId) {
                    data.refContentDelete(rowId, columnId);
                  }
                }
              }
            } else {
              // single cell
              const container = selectionController.getCellContainer(
                groupKey,
                focus.rowIndex,
                focus.columnIndex
              );
              const rowId = container?.dataset.rowId;
              const columnId = container?.dataset.columnId;
              if (rowId && columnId) {
                data.refContentDelete(rowId, columnId);
              }
            }
          }
        },
        Tab: context => {
          const selectionController =
            this.dataViewTableElement?.selectionController;
          if (!selectionController || !selectionController.focus) return;
          context.get('keyboardState').raw.preventDefault();
          selectionController.focusToCell('right', 'end');
          return true;
        },
        'Shift-Tab': context => {
          const selectionController =
            this.dataViewTableElement?.selectionController;
          if (!selectionController) return;
          context.get('keyboardState').raw.preventDefault();
          selectionController.focusToCell('left', 'end');
          return true;
        },
        ArrowLeft: context => {
          const selectionController =
            this.dataViewTableElement?.selectionController;
          if (!selectionController) return;
          if (isInCellStart(this.host.std, true)) {
            const stop = selectionController.focusToCell('left');
            if (stop) {
              context.get('keyboardState').raw.preventDefault();
              return true;
            }
          }
          return;
        },
        ArrowRight: context => {
          const selectionController =
            this.dataViewTableElement?.selectionController;
          if (!selectionController || !selectionController.focus) return;
          if (isInCellEnd(this.host.std, true)) {
            const stop = selectionController.focusToCell('right');
            if (stop) {
              context.get('keyboardState').raw.preventDefault();
              return true;
            }
          }
          return;
        },
        ArrowUp: context => {
          const selectionController =
            this.dataViewTableElement?.selectionController;
          if (!selectionController || !selectionController.focus) return;
          if (isInCellStart(this.host.std)) {
            const { isFirst } = calculateLineNum(this.host.std);
            if (!isFirst) return false;

            const stop = selectionController.focusToCell('up');
            if (stop) {
              context.get('keyboardState').raw.preventDefault();
              return true;
            }
          }
          return;
        },
        ArrowDown: context => {
          const selectionController =
            this.dataViewTableElement?.selectionController;
          if (!selectionController || !selectionController.focus) return;
          if (isInCellEnd(this.host.std)) {
            const { isLast } = calculateLineNum(this.host.std);
            if (!isLast) return;

            const stop = selectionController.focusToCell('down');
            if (stop) {
              context.get('keyboardState').raw.preventDefault();
              return true;
            }
          }
          return;
        },
        'Mod-a': () => {
          if (
            this.std.selection.filter('block').length === 1 &&
            this.std.selection.filter('block')[0].blockId === this.blockId
          ) {
            return;
          }
          this.std.selection.setGroup('note', [
            this.std.selection.create('block', { blockId: this.blockId }),
          ]);
          return true;
        },
      })
    );
  }

  override renderBlock() {
    const peekViewService = this.std.getOptional(PeekViewProvider);
    return html`
      <div
        contenteditable="false"
        style="position: relative;background-color: var(--affine-background-primary-color);border-radius: 4px"
      >
        ${this.dataView.render({
          virtualPadding$: this.virtualPadding$,
          bindHotkey: this._bindHotkey,
          handleEvent: this._handleEvent,
          selection$: this.viewSelection$,
          setSelection: this.setSelection,
          dataSource: this.dataSource,
          headerWidget: this.headerWidget,
          selectionUpdated: this.selectionUpdated,
          onDrag: this.onDrag,
          std: this.std,
          detailPanelConfig: {
            openDetailPanel: (target, data) => {
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
              if (peekViewService) {
                return peekViewService.peek({
                  target,
                  template,
                });
              } else {
                return popSideDetail(template);
              }
            },
          },
        })}
      </div>
    `;
  }

  @query('affine-microsheet-table')
  private accessor _DataViewTableElement: DataViewTable | null = null;

  override accessor useZeroWidth = true;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-microsheet': MicrosheetBlockComponent;
  }
}
