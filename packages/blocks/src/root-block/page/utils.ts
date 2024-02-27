import type { BlockModel } from '@blocksuite/store';

export function getAllowSelectedBlocks(model: BlockModel): BlockModel[] {
  const result: BlockModel[] = [];
  const blocks = model.children.slice();

  const dfs = (blocks: BlockModel[]) => {
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
