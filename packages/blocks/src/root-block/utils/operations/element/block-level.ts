import type { EditorHost } from '@blocksuite/lit';
import { type BlockElement } from '@blocksuite/lit';

export function updateBlockElementType(
  host: EditorHost,
  blockElements: BlockElement[],
  flavour: BlockSuite.Flavour,
  type?: string
) {
  const [_, ctx] = host.std.command
    .chain()
    .with({
      selectedBlocks: blockElements,
    })
    .updateBlockType({
      flavour,
      props: {
        type,
      },
    })
    .run();
  return ctx.updatedBlocks ?? [];
}
