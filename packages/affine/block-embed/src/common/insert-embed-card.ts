import type { DocMode, EmbedCardStyle } from '@blocksuite/affine-model';
import type { BlockStdScope } from '@blocksuite/block-std';
import type { BlockModel, Doc } from '@blocksuite/store';

import {
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '@blocksuite/affine-shared/consts';
import { DocModeProvider } from '@blocksuite/affine-shared/services';
import { getLastNoteBlock } from '@blocksuite/affine-shared/utils';
import { Bound, Vec } from '@blocksuite/global/utils';

function getParentModelBySelection(
  doc: Doc,
  mode: DocMode,
  selected?: BlockModel | null
): {
  index?: number;
  model?: BlockModel | null;
} {
  const currentMode = mode;
  const root = doc.root;
  if (!root)
    return {
      index: undefined,
      model: null,
    };

  if (currentMode === 'edgeless') {
    const surface =
      root.children.find(child => child.flavour === 'affine:surface') ?? null;
    return { index: undefined, model: surface };
  }

  if (currentMode === 'page') {
    let selectedBlock = selected;
    let index: undefined | number = undefined;

    if (!selectedBlock) {
      // if no block is selected, append to the last note block
      selectedBlock = getLastNoteBlock(doc);
    }

    while (selectedBlock && selectedBlock.flavour !== 'affine:note') {
      // selectedBlock = this.doc.getParent(selectedBlock.id);
      const parent = doc.getParent(selectedBlock.id);
      index = parent?.children.indexOf(selectedBlock);
      selectedBlock = parent;
    }

    return { index, model: selectedBlock };
  }

  return {
    index: undefined,
    model: null,
  };
}

interface EmbedCardProperties {
  flavour: string;
  targetStyle: EmbedCardStyle;
  props: Record<string, unknown>;
}

export function insertEmbedCard(
  std: BlockStdScope,
  properties: EmbedCardProperties
) {
  const { doc, host } = std;
  const mode = std.get(DocModeProvider).getEditorMode() ?? 'page';
  const rootService = std.getService('affine:page');
  // @ts-ignore TODO: fix after edgeless refactor
  const selectedBlock = rootService?.selectedBlocks[0]?.model;

  const { model, index } = getParentModelBySelection(doc, mode, selectedBlock);
  const { flavour, targetStyle, props } = properties;

  if (mode === 'page') {
    host.doc.addBlock(flavour as never, props, model, index);
    return;
  }
  if (mode === 'edgeless') {
    const rootId = std.doc.root?.id;
    if (!rootId) return;
    const edgelessRoot = std.view.getBlock(rootId);
    if (!edgelessRoot) return;

    // @ts-expect-error TODO: fix after edgeless refactor
    edgelessRoot.service.viewport.smoothZoom(1);
    // @ts-expect-error TODO: fix after edgeless refactor
    const surface = edgelessRoot.surface;
    const center = Vec.toVec(surface.renderer.viewport.center);
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
      surface.model
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
    return;
  }
}
