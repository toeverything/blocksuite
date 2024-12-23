import type { UniComponent } from '../utils/uni-component/index.js';
import type { SingleView } from '../view-manager/single-view.js';
import type { ViewManager } from '../view-manager/view-manager.js';
import type { DataViewExpose, DataViewProps } from './types.js';

export type BasicViewDataType<
  Type extends string = string,
  T = NonNullable<unknown>,
> = {
  id: string;
  name: string;
  mode: Type;
} & T;

export type DefaultViewDataType = BasicViewDataType & {
  mode: string;
};

export type DataViewDataType = DefaultViewDataType;

export type DataViewMode = string;

export interface DataViewModelConfig<
  Data extends DataViewDataType = DataViewDataType,
> {
  defaultName: string;
  dataViewManager: new (
    viewManager: ViewManager,
    viewId: string
  ) => SingleView<Data>;
  defaultData: (viewManager: ViewManager) => Omit<Data, 'id' | 'name' | 'mode'>;
}

export type DataViewModel<
  Type extends string = DataViewMode,
  Data extends DataViewDataType = DataViewDataType,
> = {
  type: Type;
  model: DataViewModelConfig<Data>;
};

export type GetDataFromDataViewModel<Model> =
  Model extends DataViewModel<infer _, infer R> ? R : never;

export interface DataViewRendererConfig {
  view: UniComponent<
    {
      props: DataViewProps;
    },
    { expose: DataViewExpose }
  >;
  icon: UniComponent;
}

export type ViewMeta<
  Type extends string = DataViewMode,
  Data extends DataViewDataType = DataViewDataType,
> = DataViewModel<Type, Data> & {
  renderer: DataViewRendererConfig;
};

export const viewType = <Type extends string>(type: Type) => ({
  type,
  createModel: <Data extends DataViewDataType>(
    model: DataViewModelConfig<Data>
  ): DataViewModel<Type, Data> & {
    createMeta: (renderer: DataViewRendererConfig) => ViewMeta<Type, Data>;
  } => ({
    type,
    model,
    createMeta: renderer => ({
      type,
      model,
      renderer,
    }),
  }),
});
