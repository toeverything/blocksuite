import type { BlockStdScope } from '@blocksuite/block-std';

export function getChainWithHost(std: BlockStdScope) {
  return std.command.chain().withHost();
}
