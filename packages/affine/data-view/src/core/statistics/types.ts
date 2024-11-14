import type { DataSource } from '../data-source/index.js';
import type { TypeInstance, ValueTypeOf } from '../logical/type.js';
import type { PropertyMetaConfig } from '../property/property-config.js';

export type StatisticsConfig<T extends TypeInstance = TypeInstance> = {
  group: string;
  type: string;
  dataType: T;
  menuName?: string;
  displayName?: string;
  impl?: (
    data: ReadonlyArray<ValueTypeOf<T> | undefined>,
    info: {
      meta: PropertyMetaConfig;
      dataSource: DataSource;
    }
  ) => string;
};
