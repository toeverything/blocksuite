import type { BaseBlockModel } from '@blocksuite/store';

export function getAllowSelectedBlocks(
  model: BaseBlockModel
): BaseBlockModel[] {
  const result: BaseBlockModel[] = [];
  const blocks = model.children.slice();

  const dfs = (blocks: BaseBlockModel[]) => {
    for (const block of blocks) {
      if (block.flavour !== 'affine:note') {
        result.push(block);
      }
      block.children.length && dfs(block.children);
    }
  };

  dfs(blocks);
  return result;
}
