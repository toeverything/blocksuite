import type { BlockModel } from '../schema/base.js';

type PropsInDraft = 'version' | 'flavour' | 'role' | 'id' | 'keys' | 'text';

type ModelProps<Model> = Model extends BlockModel<infer U> ? U : never;

export type DraftModel<Model extends BlockModel = BlockModel> = Pick<
  Model,
  PropsInDraft
> & {
  children: DraftModel[];
} & ModelProps<Model>;

export function toDraftModel<Model extends BlockModel = BlockModel>(
  origin: Model
): DraftModel<Model> {
  const { id, version, flavour, role, keys, text, children } = origin;
  const props = origin.keys.reduce((acc, key) => {
    return {
      ...acc,
      [key]: origin[key as keyof Model],
    };
  }, {} as ModelProps<Model>);

  return {
    id,
    version,
    flavour,
    role,
    keys,
    text,
    children: children.map(toDraftModel),
    ...props,
  } as DraftModel<Model>;
}
