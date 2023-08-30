import type { DisposableGroup } from '@blocksuite/global/utils';

import type { BaseDataViewManager } from './data-view-manager.js';

export interface BaseViewClipboardConfig<
  Data extends BaseDataViewManager = BaseDataViewManager,
> {
  data: Data;
  disposables: DisposableGroup;
}

export class BaseViewClipboard<Data extends BaseDataViewManager> {
  public currentView: string | undefined;

  protected _data: Data;
  protected _disposables: DisposableGroup;

  constructor(config: BaseViewClipboardConfig<Data>) {
    this._data = config.data;
    this._disposables = config.disposables;
  }

  public init() {
    throw new Error('You must override this method');
  }

  public isCurrentView(viewId: string) {
    return this.currentView === viewId;
  }
}
