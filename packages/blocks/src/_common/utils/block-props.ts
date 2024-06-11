import type { BlockModel } from '@blocksuite/store';

export function getBlockProps(model: BlockModel): Record<string, unknown> {
  const keys = model.keys as (keyof typeof model)[];
  const values = keys.map(key => model[key]);
  const blockProps = Object.fromEntries(keys.map((key, i) => [key, values[i]]));
  return blockProps;
}
