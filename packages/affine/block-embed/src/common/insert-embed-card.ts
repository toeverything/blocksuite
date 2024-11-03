import type { EmbedCardStyle } from '@blocksuite/affine-model';
import type { BlockStdScope } from '@blocksuite/block-std';

import { SurfaceBlockComponent } from '@blocksuite/affine-block-surface';
import {
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '@blocksuite/affine-shared/consts';
import { Bound, Vec } from '@blocksuite/global/utils';

interface EmbedCardProperties {
  flavour: string;
  targetStyle: EmbedCardStyle;
  props: Record<string, unknown>;
}

export function insertEmbedCard(
  std: BlockStdScope,
  properties: EmbedCardProperties
) {
  const { host } = std;
  const { flavour, targetStyle, props } = properties;
  const selectionManager = host.selection;

  let blockId: string | undefined;
  const textSelection = selectionManager.find('text');
  const blockSelection = selectionManager.find('block');
  const surfaceSelection = selectionManager.find('surface');
  if (textSelection) {
    blockId = textSelection.blockId;
  } else if (blockSelection) {
    blockId = blockSelection.blockId;
  } else if (surfaceSelection && surfaceSelection.editing) {
    blockId = surfaceSelection.blockId;
  }

  if (blockId) {
    const block = host.view.getBlock(blockId);
    if (!block) return;
    const parent = host.doc.getParent(block.model);
    if (!parent) return;
    const index = parent.children.indexOf(block.model);
    host.doc.addBlock(flavour as never, props, parent, index + 1);
  } else {
    const rootId = std.doc.root?.id;
    if (!rootId) return;
    const edgelessRoot = std.view.getBlock(rootId);
    if (!edgelessRoot) return;

    // @ts-expect-error TODO: fix after edgeless refactor
    edgelessRoot.service.viewport.smoothZoom(1);
    // @ts-expect-error TODO: fix after edgeless refactor
    const surfaceBlock = edgelessRoot.surface;
    if (!(surfaceBlock instanceof SurfaceBlockComponent)) return;
    const center = Vec.toVec(surfaceBlock.renderer.viewport.center);
    // @ts-expect-error TODO: fix after edgeless refactor
    const cardId = edgelessRoot.service.addBlock(
      flavour,
      {
        ...props,
        xywh: Bound.fromCenter(
          center,
          EMBED_CARD_WIDTH[targetStyle],
          EMBED_CARD_HEIGHT[targetStyle]
        ).serialize(),
        style: targetStyle,
      },
      surfaceBlock.model
    );

    // @ts-expect-error TODO: fix after edgeless refactor
    edgelessRoot.service.selection.set({
      elements: [cardId],
      editing: false,
    });

    // @ts-expect-error TODO: fix after edgeless refactor
    edgelessRoot.tools.setEdgelessTool({
      type: 'default',
    });
  }
}
