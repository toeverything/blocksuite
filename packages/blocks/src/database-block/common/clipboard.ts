import { DisposableGroup } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import type { Ref } from 'lit/directives/ref.js';

import type { DatabaseBlockModel } from '../database-model.js';
import type { DataViewExpose } from './data-view.js';
import type { DatabaseSelection } from './selection.js';

export interface BaseViewClipboardConfig {
  path: string[];
  model: DatabaseBlockModel;
  view: Ref<DataViewExpose | undefined>;
}

export class BaseViewClipboard {
  public currentView: string | undefined;

  protected _disposables = new DisposableGroup();
  protected _path: string[];
  protected _model: DatabaseBlockModel;
  protected _view: Ref<DataViewExpose | undefined>;

  constructor(config: BaseViewClipboardConfig) {
    this._path = config.path;
    this._model = config.model;
    this._view = config.view;
  }

  public init() {
    throw new Error('You must override this method');
  }

  public isCurrentView(viewId: string) {
    return this.currentView === viewId;
  }
}

export function getDatabaseSelection(root: BlockSuiteRoot) {
  const selection = root.selectionManager.value.find(
    (selection): selection is DatabaseSelection => selection.is('database')
  );
  return selection;
}
