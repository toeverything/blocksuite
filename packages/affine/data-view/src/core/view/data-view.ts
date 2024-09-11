import type { UniComponent } from '../utils/uni-component/index.js';
import type { SingleView } from '../view-manager/single-view.js';
import type { ViewManager } from '../view-manager/view-manager.js';
import type { DataViewExpose, DataViewProps } from './types.js';

declare global {
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
export type DefaultViewDataType = BasicViewDataType & {
  mode: string;
};
type FallBack<T> = [T] extends [never] ? DefaultViewDataType : T;
export type DataViewDataType = FallBack<
  _DataViewDataTypeMap[keyof _DataViewDataTypeMap]
>;
export type DataViewTypes = keyof DataViewDataTypeMap;

export interface DataViewConfig<
  Data extends DataViewDataType = DataViewDataType,
> {
  defaultName: string;
  dataViewManager: new (
    viewManager: ViewManager,
    viewId: string
  ) => SingleView<Data>;
}

export interface DataViewRendererConfig {
  view: UniComponent<
    {
      props: DataViewProps;
    },
    DataViewExpose
  >;
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
