import type { EventName, UIEventHandler } from '@blocksuite/block-std';
import type { Disposable, Slot } from '@blocksuite/global/utils';
import type { Page, Text } from '@blocksuite/store';

import type { DataViewSelection } from '../../__internal__/index.js';
import type { UniComponent } from '../../components/uni-component/uni-component.js';
import type { DatabaseBlockModel } from '../database-model.js';
import type { InsertPosition } from '../types.js';
import type { DataViewManager } from './data-view-manager.js';

export interface DataViewProps<
  T extends DataViewManager = DataViewManager,
  Selection extends DataViewSelection = DataViewSelection
> {
  view: T;

  titleText: Text;

  bindHotkey: (hotkeys: Record<string, UIEventHandler>) => Disposable;

  handleEvent: (name: EventName, handler: UIEventHandler) => Disposable;

  modalMode?: boolean;

  setSelection: (selection?: Selection) => void;

  selectionUpdated: Slot<Selection | undefined>;

  getFlag: Page['awarenessStore']['getFlag'];
}

export interface DataViewExpose {
  addRow?(position: InsertPosition): void;

  focusFirstCell(): void;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DataViewDataTypeMap {}
}
type CommonViewDataType = {
  id: string;
  name: string;
};
export type RealDataViewDataTypeMap = {
  [K in keyof DataViewDataTypeMap]: DataViewDataTypeMap[K] &
    CommonViewDataType & {
      mode: K;
    };
};
export type DefaultViewDataType = CommonViewDataType & { mode: string };
type FallBack<T> = [T] extends [never] ? DefaultViewDataType : T;
export type DataViewDataType = FallBack<
  RealDataViewDataTypeMap[keyof RealDataViewDataTypeMap]
>;
export type DataViewTypes = DataViewDataType['mode'];

export interface DataViewConfig<
  Data extends DataViewDataType = DataViewDataType
> {
  type: DataViewTypes;
  defaultName: string;

  init(model: DatabaseBlockModel, id: string, name: string): Data;
}

export interface DataViewRendererConfig<
  _Data extends DataViewDataType = DataViewDataType
> {
  type: DataViewTypes;
  view: UniComponent<DataViewProps, DataViewExpose>;
  icon: UniComponent;
  tools?: UniComponent<{
    view: DataViewManager;
  }>[];
}

export class ViewManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map = new Map<string, DataViewConfig>();

  getView(type: string): DataViewConfig {
    const view = this.map.get(type);
    if (!view) {
      throw new Error(`${type} is not exist`);
    }
    return view;
  }

  register<Type extends keyof RealDataViewDataTypeMap>(
    type: Type,
    config: Omit<DataViewConfig<RealDataViewDataTypeMap[Type]>, 'type'>
  ) {
    this.map.set(type, {
      ...config,
      type,
    });
  }

  get all() {
    return [...this.map.values()];
  }
}

export const viewManager = new ViewManager();

export class ViewRendererManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map = new Map<string, DataViewRendererConfig>();

  getView(type: string): DataViewRendererConfig {
    const view = this.map.get(type);
    if (!view) {
      throw new Error(`${type} is not exist`);
    }
    return view;
  }

  register<Type extends keyof RealDataViewDataTypeMap>(
    type: Type,
    config: Omit<DataViewRendererConfig<RealDataViewDataTypeMap[Type]>, 'type'>
  ) {
    this.map.set(type, {
      ...config,
      type,
    });
  }

  get all() {
    return [...this.map.values()];
  }
}

export const viewRendererManager = new ViewRendererManager();
