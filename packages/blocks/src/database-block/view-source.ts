import { Slot } from '@blocksuite/global/utils';

import type { SingleViewSource, ViewSource } from './data-view/common/index.js';
import type { InsertToPosition } from './data-view/types.js';
import type { DataViewTypes, ViewMeta } from './data-view/view/data-view.js';
import { type DatabaseBlockModel } from './database-model.js';
import { databaseViewAddView } from './utils.js';
import { databaseBlockViewMap, databaseBlockViews } from './views/index.js';

export class DatabaseBlockViewSource implements ViewSource {
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

  public viewAdd(viewType: DataViewTypes): string {
    this.model.doc.captureSync();
    const view = databaseViewAddView(
      this.model,
      databaseBlockViewMap[viewType]
    );
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

  public get allViewMeta(): ViewMeta[] {
    return databaseBlockViews;
  }

  public getViewMeta(type: string): ViewMeta {
    return databaseBlockViewMap[type];
  }
}
