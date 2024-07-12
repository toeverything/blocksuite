import { RangeManager } from '@blocksuite/block-std';
import { Slot } from '@blocksuite/global/utils';
import { Slice } from '@blocksuite/store';
import { css, nothing, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import type { NoteBlockComponent } from '../note-block/index.js';
import type { AffineInnerModalWidget } from '../root-block/index.js';
import type { DatabaseBlockModel } from './database-model.js';
import type { DatabaseBlockService } from './database-service.js';

import {
  BlockComponent,
  DragIndicator,
  popMenu,
} from '../_common/components/index.js';
import {
  CopyIcon,
  DeleteIcon,
  MoreHorizontalIcon,
} from '../_common/icons/index.js';
import { Rect } from '../_common/utils/index.js';
import {
  AffineDragHandleWidget,
  EdgelessRootBlockComponent,
} from '../root-block/index.js';
import {
  captureEventTarget,
  getDropResult,
} from '../root-block/widgets/drag-handle/utils.js';
import { AFFINE_INNER_MODAL_WIDGET } from '../root-block/widgets/inner-modal/inner-modal.js';
import './components/title/index.js';
import { DatabaseBlockDataSource } from './data-source.js';
import { dataViewCommonStyle } from './data-view/common/css-variable.js';
import {
  DataView,
  type DataViewExpose,
  type DataViewProps,
  type DataViewSelection,
  type DataViewWidget,
  type DataViewWidgetProps,
  DatabaseSelection,
  type ViewSource,
  defineUniComponent,
  renderUniLit,
  widgetPresets,
} from './data-view/index.js';
import { DatabaseBlockSchema } from './database-model.js';
import { DatabaseBlockViewSource } from './view-source.js';

@customElement('affine-database')
export class DatabaseBlockComponent extends BlockComponent<
  DatabaseBlockModel,
  DatabaseBlockService
> {
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

  _bindHotkey: DataViewProps['bindHotkey'] = hotkeys => {
    return {
      dispose: this.host.event.bindHotkey(hotkeys, {
        path: this.topContenteditableElement?.path ?? this.path,
      }),
    };
  };

  private _clickDatabaseOps = (e: MouseEvent) => {
    popMenu(e.currentTarget as HTMLElement, {
      options: {
        input: {
          initValue: this.model.title.toString(),
          onComplete: text => {
            this.model.title.replace(0, this.model.title.length, text);
          },
          placeholder: 'Untitled',
        },
        items: [
          {
            icon: CopyIcon,
            name: 'Copy',
            select: () => {
              const slice = Slice.fromModels(this.doc, [this.model]);
              this.std.clipboard.copySlice(slice).catch(console.error);
            },
            type: 'action',
          },
          // {
          //   type: 'action',
          //   icon: DuplicateIcon,
          //   name: 'Duplicate',
          //   select: () => {
          //   },
          // },
          {
            children: () => [
              {
                class: 'delete-item',
                icon: DeleteIcon,
                name: 'Delete Database',
                select: () => {
                  this.model.children.slice().forEach(block => {
                    this.doc.deleteBlock(block);
                  });
                  this.doc.deleteBlock(this.model);
                },
                type: 'action',
              },
            ],
            name: '',
            type: 'group',
          },
        ],
      },
    });
  };

  private _dataSource?: DatabaseBlockDataSource;

  _handleEvent: DataViewProps['handleEvent'] = (name, handler) => {
    return {
      dispose: this.host.event.add(name, handler, {
        path: this.path,
      }),
    };
  };

  private _viewSource?: ViewSource;

  private dataView = new DataView();

  private renderTitle = (dataViewMethod: DataViewExpose) => {
    const addRow = () => dataViewMethod.addRow?.('start');
    return html` <affine-database-title
      style="overflow: hidden"
      .titleText="${this.model.title}"
      .readonly="${this.doc.readonly}"
      .onPressEnterKey="${addRow}"
    ></affine-database-title>`;
  };

  getRootService = () => {
    return this.std.spec.getService('affine:page');
  };

  headerWidget: DataViewWidget = defineUniComponent(
    (props: DataViewWidgetProps) => {
      return html`
        <div style="margin-bottom: 16px;display:flex;flex-direction: column">
          <div style="display:flex;gap:8px;padding: 0 6px;margin-bottom: 8px;">
            ${this.renderTitle(props.viewMethods)} ${this.renderDatabaseOps()}
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
        const model = this.doc.getBlockById(id);
        const target = this.doc.getBlockById(result.dropBlockId);
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
            new DatabaseSelection({
              blockId: this.blockId,
              viewSelection: selection,
            }),
          ]
        : []
    );
  };

  toolsWidget: DataViewWidget = widgetPresets.createTools({
    kanban: [
      widgetPresets.tools.filter,
      widgetPresets.tools.expand,
      widgetPresets.tools.search,
      widgetPresets.tools.viewOptions,
    ],
    table: [
      widgetPresets.tools.filter,
      widgetPresets.tools.expand,
      widgetPresets.tools.search,
      widgetPresets.tools.viewOptions,
      widgetPresets.tools.tableAddRow,
    ],
  });

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
        if (data.key === 'columns' || data.key === 'cells') {
          this.dataSource.slots.update.emit();
        }
      })
    );
    let canDrop = false;
    this.disposables.add(
      AffineDragHandleWidget.registerOption({
        flavour: DatabaseBlockSchema.model.flavour,
        onDragEnd: ({ draggingElements, state }) => {
          const target = state.raw.target;
          const view = this.view;
          if (
            canDrop &&
            view &&
            view.moveTo &&
            target instanceof HTMLElement &&
            this.parentElement?.contains(target)
          ) {
            const blocks = draggingElements.map(v => v.model);
            this.doc.moveBlocks(blocks, this.model);
            blocks.forEach(model => {
              view.moveTo?.(model.id, state.raw);
            });
            view.hideIndicator?.();
            return false;
          }
          if (canDrop) {
            view?.hideIndicator?.();
            canDrop = false;
          }
          return false;
        },
        onDragMove: state => {
          const target = captureEventTarget(state.raw.target);
          const view = this.view;
          if (view && target instanceof HTMLElement && this.contains(target)) {
            canDrop = view.showIndicator?.(state.raw) ?? false;
            return false;
          }
          if (canDrop) {
            view?.hideIndicator?.();
            canDrop = false;
          }
          return false;
        },
      })
    );
  }

  override renderBlock() {
    const peekViewService = this.getRootService().peekViewService;
    return html`
      <div
        contenteditable="false"
        style="position: relative;background-color: var(--affine-background-primary-color);border-radius: 4px"
      >
        ${this.dataView.render({
          bindHotkey: this._bindHotkey,
          dataSource: this.dataSource,
          detailPanelConfig: {
            openDetailPanel: peekViewService
              ? (target, template) => peekViewService.peek(target, template)
              : undefined,
            target: () => this.innerModalWidget.target,
          },
          getFlag: this.getFlag,
          handleEvent: this._handleEvent,
          headerWidget: this.headerWidget,
          onDrag: this.onDrag,
          selectionUpdated: this.selectionUpdated,
          setSelection: this.setSelection,
          std: this.std,
          viewSource: this.viewSource,
        })}
      </div>
    `;
  }

  get dataSource(): DatabaseBlockDataSource {
    if (!this._dataSource) {
      this._dataSource = new DatabaseBlockDataSource(this.host, {
        blockId: this.model.id,
        pageId: this.host.doc.id,
      });
    }
    return this._dataSource;
  }

  get getFlag() {
    return this.host.doc.awarenessStore.getFlag.bind(
      this.host.doc.awarenessStore
    );
  }

  get innerModalWidget() {
    return this.rootElement!.widgetElements[
      AFFINE_INNER_MODAL_WIDGET
    ] as AffineInnerModalWidget;
  }

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

  get viewSource(): ViewSource {
    if (!this._viewSource) {
      this._viewSource = new DatabaseBlockViewSource(this.model);
    }
    return this._viewSource;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database': DatabaseBlockComponent;
  }
}
