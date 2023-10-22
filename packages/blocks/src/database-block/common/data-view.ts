import type { EventName, UIEventHandler } from '@blocksuite/block-std';
import type { Disposable, Slot } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';

import type { UniComponent } from '../../_common/components/uni-component/uni-component.js';
import type { DataViewSelection } from '../../_common/utils/index.js';
import type { DatabaseBlockModel } from '../database-model.js';
import type { InsertToPosition } from '../types.js';
import type { DataViewManager } from './data-view-manager.js';

export type DataViewHeaderComponentProp<
  T extends DataViewManager = DataViewManager,
> = UniComponent<{ viewMethods: DataViewExpose; view: T }>;

export interface DataViewProps<
  T extends DataViewManager = DataViewManager,
  Selection extends DataViewSelection = DataViewSelection,
> {
  header?: DataViewHeaderComponentProp<T>;

  view: T;

  bindHotkey: (hotkeys: Record<string, UIEventHandler>) => Disposable;

  handleEvent: (name: EventName, handler: UIEventHandler) => Disposable;

  setSelection: (selection?: Selection) => void;

  selectionUpdated: Slot<Selection | undefined>;

  onDrag?: (evt: MouseEvent, id: string) => () => void;

  getFlag?: Page['awarenessStore']['getFlag'];
}

export interface DataViewExpose {
  addRow?(position: InsertToPosition | number): void;

  getSelection?(): DataViewSelection | undefined;

  focusFirstCell(): void;

  showIndicator?(evt: MouseEvent): boolean;

  hideIndicator?(): void;

  moveTo?(id: string, evt: MouseEvent): void;
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
  Data extends DataViewDataType = DataViewDataType,
> {
  type: DataViewTypes;
  defaultName: string;

  init(model: DatabaseBlockModel, id: string, name: string): Data;
}

export type DataViewToolsProps<
  Manager extends DataViewManager = DataViewManager,
> = {
  view: Manager;
  viewMethod: DataViewExpose;
};

export interface DataViewRendererConfig<
  _Data extends DataViewDataType = DataViewDataType,
> {
  type: DataViewTypes;
  view: UniComponent<DataViewProps, DataViewExpose>;
  icon: UniComponent;
  tools?: UniComponent<DataViewToolsProps>[];
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
    return Array.from(this.map.values());
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
    return Array.from(this.map.values());
  }
}

export const viewRendererManager = new ViewRendererManager();
