import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import { type BaseBlockModel } from '@blocksuite/store';

export function getSelectedContentModels(
  root: EditorHost,
  types: Extract<BlockSuite.SelectionType, 'block' | 'text' | 'image'>[]
): BaseBlockModel[] {
  const result: BaseBlockModel[] = [];
  root.std.command
    .pipe()
    .withHost()
    .tryAll(chain => [
      chain.getTextSelection(),
      chain.getBlockSelections(),
      chain.getImageSelections(),
    ])
    .getSelectedBlocks({
      types,
    })
    .inline(ctx => {
      const { selectedBlocks } = ctx;
      assertExists(selectedBlocks);
      result.push(...selectedBlocks.map(el => el.model));
    })
    .run();
  return result;
}
