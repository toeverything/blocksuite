import type {
  BlockStdScope,
  EventName,
  UIEventHandler,
} from '@blocksuite/block-std';
import type { Disposable, Slot } from '@blocksuite/global/utils';
import type { Doc } from '@blocksuite/store';

import type { DataSource } from '../common/data-source/base.js';
import type { ViewSource } from '../common/index.js';
import type { DataViewRenderer } from '../data-view.js';
import type { DataViewSelection, InsertToPosition } from '../types.js';
import type { UniComponent } from '../utils/uni-component/index.js';
import type { DataViewWidget } from '../widget/types.js';
import type { DataViewManagerBase } from './data-view-manager.js';
import type { DataViewManager } from './data-view-manager.js';

export interface DataViewProps<
  T extends DataViewManager = DataViewManager,
  Selection extends DataViewSelection = DataViewSelection,
> {
  bindHotkey: (hotkeys: Record<string, UIEventHandler>) => Disposable;

  dataSource: DataSource;

  dataViewEle: DataViewRenderer;
  getFlag?: Doc['awarenessStore']['getFlag'];
  handleEvent: (name: EventName, handler: UIEventHandler) => Disposable;

  headerWidget?: DataViewWidget;

  onDrag?: (evt: MouseEvent, id: string) => () => void;

  selectionUpdated: Slot<Selection | undefined>;

  setSelection: (selection?: Selection) => void;

  std: BlockStdScope;

  view: T;

  viewSource: ViewSource;
}

export interface DataViewExpose {
  addRow?(position: InsertToPosition | number): void;

  focusFirstCell(): void;

  getSelection?(): DataViewSelection | undefined;

  hideIndicator?(): void;

  moveTo?(id: string, evt: MouseEvent): void;

  showIndicator?(evt: MouseEvent): boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DataViewDataTypeMap {}
}
export type BasicViewDataType<
  Type extends string = string,
  T = NonNullable<unknown>,
> = {
  id: string;
  mode: Type;
  name: string;
} & T;
export type _DataViewDataTypeMap = {
  [K in keyof DataViewDataTypeMap]: BasicViewDataType<
    Extract<K, string>,
    DataViewDataTypeMap[K]
  >;
};
export type DefaultViewDataType = { mode: string } & BasicViewDataType;
type FallBack<T> = [T] extends [never] ? DefaultViewDataType : T;
export type DataViewDataType = FallBack<
  _DataViewDataTypeMap[keyof _DataViewDataTypeMap]
>;
export type DataViewTypes = keyof DataViewDataTypeMap;
export interface DataViewConfig<
  Data extends DataViewDataType = DataViewDataType,
> {
  dataViewManager: new () => DataViewManagerBase<Data>;
  defaultName: string;
}

export interface DataViewRendererConfig {
  icon: UniComponent;
  view: UniComponent<DataViewProps, DataViewExpose>;
}

export type ViewMeta<
  Type extends string = DataViewTypes,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Data extends DataViewDataType = any,
> = {
  model: DataViewConfig<Data>;
  renderer: DataViewRendererConfig;
  type: Type;
};
export const viewType = <Type extends string>(type: Type) => ({
  modelConfig: <Data extends DataViewDataType>(
    model: DataViewConfig<Data>
  ) => ({
    model,
    rendererConfig: (renderer: DataViewRendererConfig) => ({
      model,
      renderer,
      type,
    }),
    type,
  }),
  type,
});

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

  get all() {
    return Array.from(this.map.values());
  }
}

export const viewRendererManager = new ViewRendererManager();
