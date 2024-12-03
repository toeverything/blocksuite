import type { Renderer } from './renderer.js';
import type { PropertyConfig } from './types.js';

export type PropertyMetaConfig<
  Type extends string = string,
  PropertyData extends NonNullable<unknown> = NonNullable<unknown>,
  CellData = unknown,
> = {
  type: Type;
  config: PropertyConfig<PropertyData, CellData>;
  create: Create<PropertyData>;
  renderer: Renderer<PropertyData, CellData>;
};
type CreatePropertyMeta<
  Type extends string = string,
  PropertyData extends Record<string, unknown> = Record<string, never>,
  CellData = unknown,
> = (
  renderer: Omit<Renderer<PropertyData, CellData>, 'type'>
) => PropertyMetaConfig<Type, PropertyData, CellData>;
type Create<
  PropertyData extends Record<string, unknown> = Record<string, never>,
> = (
  name: string,
  data?: PropertyData
) => {
  type: string;
  name: string;
  statCalcOp?: string;
  data: PropertyData;
};
export type PropertyModel<
  Type extends string = string,
  PropertyData extends Record<string, unknown> = Record<string, never>,
  CellData = unknown,
> = {
  type: Type;
  config: PropertyConfig<PropertyData, CellData>;
  create: Create<PropertyData>;
  createPropertyMeta: CreatePropertyMeta<Type, PropertyData, CellData>;
};
export const propertyType = <Type extends string>(type: Type) => ({
  type: type,
  modelConfig: <
    CellData,
    PropertyData extends Record<string, unknown> = Record<string, never>,
  >(
    ops: PropertyConfig<PropertyData, CellData>
  ): PropertyModel<Type, PropertyData, CellData> => {
    const create: Create<PropertyData> = (name, data) => {
      return {
        type,
        name,
        data: data ?? ops.defaultData(),
      };
    };
    return {
      type,
      config: ops,
      create,
      createPropertyMeta: renderer => ({
        type,
        config: ops,
        create,
        renderer: {
          type,
          ...renderer,
        },
      }),
    };
  },
});
