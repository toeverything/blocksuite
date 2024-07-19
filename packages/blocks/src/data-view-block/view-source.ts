import { Slot } from '@blocksuite/global/utils';

import type { SingleViewSource } from '../database-block/data-view/common/index.js';
import type {
  DataViewDataType,
  InsertToPosition,
  ViewMeta,
  ViewSource,
} from '../database-block/data-view/index.js';
import type { DataViewTypes } from '../database-block/data-view/view/data-view.js';
import type { DataViewBlockModel } from './data-view-model.js';

import { blockQueryViewMap, blockQueryViews } from './views/index.js';

export class BlockQueryViewSource implements ViewSource {
  private currentId?: string;

  private viewMap = new Map<string, SingleViewSource>();

  updateSlot = new Slot<{ viewId?: string }>();

  viewInit: Record<
    (typeof blockQueryViews)[number]['type'],
    () => DataViewDataType
  > = {
    table: () => {
      return {
        id: this.model.doc.generateBlockId(),
        name: 'Table View',
        mode: 'table',
        columns: [],
        filter: {
          type: 'group',
          op: 'and',
          conditions: [],
        },
      };
    },
    kanban: () => {
      return {
        id: this.model.doc.generateBlockId(),
        name: 'Kanban View',
        mode: 'kanban',
        columns: [],
        filter: {
          type: 'group',
          op: 'and',
          conditions: [],
        },
        header: {
          iconColumn: 'type',
        },
        groupProperties: [],
      };
    },
  };

  constructor(private model: DataViewBlockModel) {}

  checkViewDataUpdate(): void {
    this.model.views.forEach(v => {
      this.updateSlot.emit({ viewId: v.id });
    });
  }

  duplicate(id: string): void {
    const newId = this.model.duplicateView(id);
    this.selectView(newId);
  }

  getViewMeta(type: string): ViewMeta {
    return blockQueryViewMap[type];
  }

  moveTo(id: string, position: InsertToPosition): void {
    this.model.moveViewTo(id, position);
  }

  selectView(id: string): void {
    this.currentId = id;
    this.updateSlot.emit({});
  }

  viewAdd(viewType: DataViewTypes): string {
    this.model.doc.captureSync();
    const view = this.viewInit[viewType]();
    this.model.doc.transact(() => {
      this.model.views.push(view);
    });
    this.model.applyViewsUpdate();
    return view.id;
  }

  viewGet(id: string): SingleViewSource {
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
      const slot = new Slot<{ viewId: string }>();
      this.updateSlot
        .flatMap(data => {
          if (data.viewId === id) {
            return { viewId: id };
          }
          return [];
        })
        .pipe(slot);
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
          if (this.model.views.length === 1) {
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

  get allViewMeta(): ViewMeta[] {
    return blockQueryViews;
  }

  get currentView(): SingleViewSource {
    return this.viewGet(this.currentViewId);
  }

  get currentViewId(): string {
    return this.currentId ?? this.model.views[0].id;
  }

  get readonly(): boolean {
    return this.model.doc.readonly;
  }

  get views(): SingleViewSource[] {
    return this.model.views.map(v => this.viewGet(v.id));
  }
}
