import type {
  BlockStdScope,
  EventName,
  UIEventHandler,
} from '@blocksuite/block-std';
import type { Disposable, Slot } from '@blocksuite/global/utils';
import type { Doc } from '@blocksuite/store';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';

import type { DataSource } from '../common/data-source/base.js';
import type { ViewSource } from '../common/index.js';
import type { DataViewRenderer } from '../data-view.js';
import type { DataViewSelection, InsertToPosition } from '../types.js';
import type { UniComponent } from '../utils/uni-component/index.js';
import type { DataViewWidget } from '../widget/types.js';
import type {
  DataViewManager,
  DataViewManagerBase,
} from './data-view-manager.js';

export interface DataViewProps<
  T extends DataViewManager = DataViewManager,
  Selection extends DataViewSelection = DataViewSelection,
> {
  dataViewEle: DataViewRenderer;

  headerWidget?: DataViewWidget;

  view: T;
  viewSource: ViewSource;
  dataSource: DataSource;

  bindHotkey: (hotkeys: Record<string, UIEventHandler>) => Disposable;

  handleEvent: (name: EventName, handler: UIEventHandler) => Disposable;

  setSelection: (selection?: Selection) => void;

  selectionUpdated: Slot<Selection | undefined>;

  onDrag?: (evt: MouseEvent, id: string) => () => void;

  getFlag?: Doc['awarenessStore']['getFlag'];

  std: BlockStdScope;
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
export type BasicViewDataType<
  Type extends string = string,
  T = NonNullable<unknown>,
> = {
  id: string;
  name: string;
  mode: Type;
} & T;
export type _DataViewDataTypeMap = {
  [K in keyof DataViewDataTypeMap]: BasicViewDataType<
    Extract<K, string>,
    DataViewDataTypeMap[K]
  >;
};
export type DefaultViewDataType = BasicViewDataType & { mode: string };
type FallBack<T> = [T] extends [never] ? DefaultViewDataType : T;
export type DataViewDataType = FallBack<
  _DataViewDataTypeMap[keyof _DataViewDataTypeMap]
>;
export type DataViewTypes = keyof DataViewDataTypeMap;
export interface DataViewConfig<
  Data extends DataViewDataType = DataViewDataType,
> {
  defaultName: string;
  dataViewManager: new () => DataViewManagerBase<Data>;
}

export interface DataViewRendererConfig {
  view: UniComponent<DataViewProps, DataViewExpose>;
  icon: UniComponent;
}

export type ViewMeta<
  Type extends string = DataViewTypes,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Data extends DataViewDataType = any,
> = {
  type: Type;
  model: DataViewConfig<Data>;
  renderer: DataViewRendererConfig;
};
export const viewType = <Type extends string>(type: Type) => ({
  type,
  modelConfig: <Data extends DataViewDataType>(
    model: DataViewConfig<Data>
  ) => ({
    type,
    model,
    rendererConfig: (renderer: DataViewRendererConfig) => ({
      type,
      model,
      renderer,
    }),
  }),
});

export class ViewRendererManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map = new Map<string, DataViewRendererConfig>();

  getView(type: string): DataViewRendererConfig {
    const view = this.map.get(type);
    if (!view) {
      throw new BlockSuiteError(
        ErrorCode.DatabaseBlockError,
        `${type} is not exist`
      );
    }
    return view;
  }

  get all() {
    return Array.from(this.map.values());
  }
}

export const viewRendererManager = new ViewRendererManager();
