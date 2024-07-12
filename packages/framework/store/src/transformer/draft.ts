import type { BlockModel } from '../schema/base.js';

type PropsInDraft =
  | 'flavour'
  | 'id'
  | 'keys'
  | 'page'
  | 'role'
  | 'text'
  | 'version';

type ModelProps<Model> = Model extends BlockModel<infer U> ? U : never;

export type DraftModel<Model extends BlockModel = BlockModel> = {
  children: DraftModel[];
} & ModelProps<Model> &
  Pick<Model, PropsInDraft>;

export function toDraftModel<Model extends BlockModel = BlockModel>(
  origin: Model
): DraftModel<Model> {
  const { children, flavour, id, keys, role, text, version } = origin;
  const props = origin.keys.reduce((acc, key) => {
    return {
      ...acc,
      [key]: origin[key as keyof Model],
    };
  }, {} as ModelProps<Model>);

  return {
    children: children.map(toDraftModel),
    flavour,
    id,
    keys,
    role,
    text,
    version,
    ...props,
  } as DraftModel<Model>;
}
