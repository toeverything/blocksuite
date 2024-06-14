import { Slot } from '@blocksuite/global/utils';

import type { SingleViewSource, ViewSource } from './data-view/common/index.js';
import type { InsertToPosition } from './data-view/types.js';
import type { DataViewTypes, ViewMeta } from './data-view/view/data-view.js';
import type { DatabaseBlockModel } from './database-model.js';
import { databaseViewAddView } from './utils.js';
import { databaseBlockViewMap, databaseBlockViews } from './views/index.js';

export class DatabaseBlockViewSource implements ViewSource {
  get currentViewId(): string {
    return this.currentId ?? this.model.views[0].id;
  }

  get views(): SingleViewSource[] {
    return this.model.views.map(v => this.viewGet(v.id));
  }

  get currentView(): SingleViewSource {
    return this.viewGet(this.currentViewId);
  }

  get readonly(): boolean {
    return this.model.doc.readonly;
  }

  get allViewMeta(): ViewMeta[] {
    return databaseBlockViews;
  }

  private viewMap = new Map<string, SingleViewSource>();

  private currentId?: string;

  updateSlot = new Slot<{
    viewId?: string;
  }>();

  constructor(private model: DatabaseBlockModel) {}

  checkViewDataUpdate(): void {
    this.model.views.forEach(v => {
      this.updateSlot.emit({ viewId: v.id });
    });
  }

  selectView(id: string): void {
    this.currentId = id;
    this.updateSlot.emit({});
  }

  viewAdd(viewType: DataViewTypes): string {
    this.model.doc.captureSync();
    const view = databaseViewAddView(
      this.model,
      databaseBlockViewMap[viewType]
    );
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

  duplicate(id: string): void {
    const newId = this.model.duplicateView(id);
    this.selectView(newId);
  }

  moveTo(id: string, position: InsertToPosition): void {
    this.model.moveViewTo(id, position);
  }

  getViewMeta(type: string): ViewMeta {
    return databaseBlockViewMap[type];
  }
}
