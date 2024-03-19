// related component
import './common/group-by/define.js';
import './common/header/views.js';
import './common/header/title.js';
import './common/header/tools/tools.js';
import './common/filter/filter-bar.js';
import './data-view.js';

import { PathFinder } from '@blocksuite/block-std';
import { BlockElement, RangeManager } from '@blocksuite/block-std';
import { Slot } from '@blocksuite/global/utils';
import { Slice } from '@blocksuite/store';
import { css, nothing, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { html } from 'lit/static-html.js';

import { DragIndicator } from '../_common/components/index.js';
import { popMenu } from '../_common/components/menu/index.js';
import { defineUniComponent } from '../_common/components/uni-component/uni-component.js';
import {
  CopyIcon,
  DeleteIcon,
  MoreHorizontalIcon,
} from '../_common/icons/index.js';
import type { DataViewSelection } from '../_common/utils/index.js';
import { Rect } from '../_common/utils/index.js';
import type { NoteBlockComponent } from '../note-block/note-block.js';
import { EdgelessRootBlockComponent } from '../root-block/edgeless/edgeless-root-block.js';
import { AffineDragHandleWidget } from '../root-block/widgets/drag-handle/drag-handle.js';
import {
  captureEventTarget,
  getDropResult,
} from '../root-block/widgets/drag-handle/utils.js';
import { dataViewCommonStyle } from './common/css-variable.js';
import type { DataViewProps, DataViewTypes } from './common/data-view.js';
import { type DataViewExpose } from './common/data-view.js';
import type { DataViewManager } from './common/data-view-manager.js';
import type { DataSource } from './common/datasource/base.js';
import { DatabaseBlockDatasource } from './common/datasource/database-block-datasource.js';
import { renderFilterBar } from './common/filter/filter-bar.js';
import { renderTools } from './common/header/tools/tools.js';
import { DatabaseSelection } from './common/selection.js';
import type { SingleViewSource, ViewSource } from './common/view-source.js';
import type { DataViewNative, DataViewNativeConfig } from './data-view.js';
import type { DatabaseBlockModel } from './database-model.js';
import { DatabaseBlockSchema } from './database-model.js';
import type { DatabaseService } from './database-service.js';
import type { InsertToPosition } from './types.js';

@customElement('affine-database')
export class DatabaseBlockComponent extends BlockElement<
  DatabaseBlockModel,
  DatabaseService
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
  private _clickDatabaseOps = (e: MouseEvent) => {
    popMenu(e.currentTarget as HTMLElement, {
      options: {
        input: {
          initValue: this.model.title.toString(),
          placeholder: 'Untitled',
          onComplete: text => {
            this.model.title.replace(0, this.model.title.length, text);
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
    return html`<div class="database-ops" @click="${this._clickDatabaseOps}">
      ${MoreHorizontalIcon}
    </div>`;
  }

  override get topContenteditableElement() {
    if (this.rootElement instanceof EdgelessRootBlockComponent) {
      const note = this.closest<NoteBlockComponent>('affine-note');
      return note;
    }
    return this.rootElement;
  }

  override connectedCallback() {
    super.connectedCallback();

    this.setAttribute(RangeManager.rangeSyncExcludeAttr, 'true');

    this._disposables.add(
      this.selection.slots.changed.on(selections => {
        const databaseSelection = selections.find(
          (selection): selection is DatabaseSelection => {
            if (!PathFinder.equals(selection.path, this.path)) {
              return false;
            }
            return selection instanceof DatabaseSelection;
          }
        );
        this.selectionUpdated.emit(databaseSelection?.viewSelection);
      })
    );
    this._disposables.add(
      this.model.propsUpdated.on(() => {
        this.viewSource.updateSlot.emit();
      })
    );
    let canDrop = false;
    this.disposables.add(
      AffineDragHandleWidget.registerOption({
        flavour: DatabaseBlockSchema.model.flavour,
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
        onDragEnd: ({ state, draggingElements }) => {
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
      })
    );
  }

  private _view = createRef<DataViewNative>();

  get view() {
    return this._view.value?.expose;
  }

  private _dataSource?: DataSource;
  public get dataSource(): DataSource {
    if (!this._dataSource) {
      this._dataSource = new DatabaseBlockDatasource(this.host, {
        type: 'database-block',
        pageId: this.host.doc.id,
        blockId: this.model.id,
      });
    }
    return this._dataSource;
  }

  public focusFirstCell = () => {
    this._view.value?.focusFirstCell();
  };

  private renderViews = () => {
    return html` <data-view-header-views
      style="flex:1"
      .viewSource="${this._viewSource}"
    ></data-view-header-views>`;
  };
  private renderTitle = (dataViewMethod: DataViewExpose) => {
    const addRow = () => dataViewMethod.addRow?.('start');
    return html` <affine-database-title
      style="overflow: hidden"
      .titleText="${this.model.title}"
      .readonly="${this.doc.readonly}"
      .onPressEnterKey="${addRow}"
    ></affine-database-title>`;
  };
  private renderReference = () => {
    return html`<div></div>`;
  };

  headerComponent = defineUniComponent(
    ({
      view,
      viewMethods,
    }: {
      view: DataViewManager;
      viewMethods: DataViewExpose;
    }) => {
      return html`
        <div style="margin-bottom: 16px;display:flex;flex-direction: column">
          <div style="display:flex;gap:8px;padding: 0 6px;margin-bottom: 8px;">
            ${this.renderTitle(viewMethods)} ${this.renderDatabaseOps()}
            ${this.renderReference()}
          </div>
          <div
            style="display:flex;align-items:center;justify-content: space-between;gap: 12px"
          >
            ${this.renderViews()} ${renderTools(view, viewMethods)}
          </div>
          ${renderFilterBar(view)}
        </div>
      `;
    }
  );

  private _viewSource?: ViewSource;
  public get viewSource(): ViewSource {
    if (!this._viewSource) {
      this._viewSource = new DatabaseBlockViewSource(this.model);
    }
    return this._viewSource;
  }

  setSelection = (selection: DataViewSelection | undefined) => {
    this.selection.setGroup(
      'note',
      selection
        ? [new DatabaseSelection({ path: this.path, viewSelection: selection })]
        : []
    );
  };
  selectionUpdated = new Slot<DataViewSelection | undefined>();

  get getFlag() {
    return this.host.doc.awarenessStore.getFlag.bind(
      this.host.doc.awarenessStore
    );
  }

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

  override renderBlock() {
    const config: DataViewNativeConfig = {
      bindHotkey: this._bindHotkey,
      handleEvent: this._handleEvent,
      getFlag: this.getFlag,
      selectionUpdated: this.selectionUpdated,
      setSelection: this.setSelection,
      dataSource: this.dataSource,
      viewSource: this.viewSource,
      headerComponent: this.headerComponent,
      onDrag: this.onDrag,
      std: this.std,
    };
    return html`
      <div contenteditable="false" style="position: relative">
        <affine-data-view-native
          ${ref(this._view)}
          .config="${config}"
        ></affine-data-view-native>

        <affine-block-selection
          .block=${this}
          style="z-index: 1"
        ></affine-block-selection>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database': DatabaseBlockComponent;
  }
}

class DatabaseBlockViewSource implements ViewSource {
  constructor(private model: DatabaseBlockModel) {}

  get currentViewId(): string {
    return this.currentId ?? this.model.views[0].id;
  }

  private viewMap = new Map<string, SingleViewSource>();
  private currentId?: string;

  public selectView(id: string): void {
    this.currentId = id;
    this.updateSlot.emit();
  }

  public updateSlot = new Slot();

  public get views(): SingleViewSource[] {
    return this.model.views.map(v => this.viewGet(v.id));
  }

  public get currentView(): SingleViewSource {
    return this.viewGet(this.currentViewId);
  }

  public get readonly(): boolean {
    return this.model.doc.readonly;
  }

  public viewAdd(type: DataViewTypes): string {
    this.model.doc.captureSync();
    const view = this.model.addView(type);
    this.model.applyViewsUpdate();
    return view.id;
  }

  public viewGet(id: string): SingleViewSource {
    let result = this.viewMap.get(id);
    if (!result) {
      const getView = () => {
        return this.model.views.find(v => v.id === id);
      };
      const view = getView();
      if (!view) {
        throw new Error('view not found');
      }
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;
      const slot = new Slot();
      this.updateSlot.pipe(slot);
      result = {
        duplicate(): void {
          self.duplicate(id);
        },
        get view() {
          const view = getView();
          if (!view) {
            throw new Error('view not found');
          }
          return view;
        },
        updateView: updater => {
          this.model.doc.captureSync();
          this.model.updateView(id, updater);
          this.model.applyViewsUpdate();
        },
        delete: () => {
          this.model.doc.captureSync();
          if (this.model.getViewList().length === 1) {
            this.model.doc.deleteBlock(this.model);
            return;
          }
          this.model.deleteView(id);
          this.currentId = undefined;
          this.model.applyViewsUpdate();
        },
        get readonly() {
          return self.model.doc.readonly;
        },
        updateSlot: slot,
        isDeleted() {
          return self.model.views.every(v => v.id !== id);
        },
      };
      this.viewMap.set(id, result);
    }
    return result;
  }

  public duplicate(id: string): void {
    const newId = this.model.duplicateView(id);
    this.selectView(newId);
  }

  public moveTo(id: string, position: InsertToPosition): void {
    this.model.moveViewTo(id, position);
  }
}
