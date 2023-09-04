import { assertNotExists } from '@blocksuite/global/utils';
import type { IUnionFs } from 'unionfs';

import type { BaseBlockModel } from '../schema/index.js';
import { toJSON } from './json.js';

type BlockToJSONProps<Props extends object = object> = {
  model: BaseBlockModel<Props>;
  fs: IUnionFs;
};
type BlockToJson<Props extends object = object> = (
  props: BlockToJSONProps<Props>
) => Record<string, unknown>;
const defaultBlockToJSON: BlockToJson = ({ model }) => {
  const data: Record<string, unknown> = {};
  const props: Record<string, unknown> = {};
  model.yBlock.forEach((value, key) => {
    props[key] = toJSON(value);
  });
  data.props = props;
  return data;
};

export function blockToJson<Props extends object = object>(
  model: BaseBlockModel<Props>,
  fs: IUnionFs,
  blockToJSON: BlockToJson<Props> = defaultBlockToJSON
): Record<string, unknown> {
  const { children } = model;
  const json = blockToJSON({ model, fs });
  assertNotExists(json.id, 'id is not allowed in blockToJSON');
  assertNotExists(json.flavour, 'flavour is not allowed in blockToJSON');
  assertNotExists(json.children, 'children is not allowed in blockToJSON');
  json.id = model.id;
  json.flavour = model.flavour;
  json.children = children.map(child => blockToJson(child, fs, blockToJSON));

  Object.freeze(json);

  return json;
}
