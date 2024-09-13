import type { Command } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

import {
  asyncSetInlineRange,
  focusTextModel,
} from '@blocksuite/affine-components/rich-text';
import { matchFlavours } from '@blocksuite/affine-shared/utils';

import { onModelTextUpdated } from '../../root-block/utils/callback.js';
import {
  mergeToCodeModel,
  transformModel,
} from '../../root-block/utils/operations/model.js';

type UpdateBlockConfig = {
  flavour: BlockSuite.Flavour;
  props?: Record<string, unknown>;
};

export const updateBlockType: Command<
  'selectedBlocks',
  'updatedBlocks',
  UpdateBlockConfig
> = (ctx, next) => {
  const { std, flavour, props } = ctx;
  const host = std.host;
  const doc = std.doc;

  const getSelectedBlocks = () => {
    let { selectedBlocks } = ctx;

    if (selectedBlocks == null) {
      const [result, ctx] = std.command
        .chain()
        .tryAll(chain => [chain.getTextSelection(), chain.getBlockSelections()])
        .getSelectedBlocks({ types: ['text', 'block'] })
        .run();
      if (result) {
        selectedBlocks = ctx.selectedBlocks;
      }
    }

    return selectedBlocks;
  };

  const selectedBlocks = getSelectedBlocks();
  if (!selectedBlocks || selectedBlocks.length === 0) return false;

  const blockModels = selectedBlocks.map(ele => ele.model);

  const hasSameDoc = selectedBlocks.every(block => block.doc === doc);
  if (!hasSameDoc) {
    // doc check
    console.error(
      'Not all models have the same doc instance, the result for update text type may not be correct',
      selectedBlocks
    );
  }

  const mergeToCode: Command<never, 'updatedBlocks'> = (_, next) => {
    if (flavour !== 'affine:code') return;
    const id = mergeToCodeModel(blockModels);
    if (!id) return;
    const model = doc.getBlockById(id);
    if (!model) return;
    asyncSetInlineRange(host, model, {
      index: model.text?.length ?? 0,
      length: 0,
    }).catch(console.error);
    return next({ updatedBlocks: [model] });
  };
  const appendDivider: Command<never, 'updatedBlocks'> = (_, next) => {
    if (flavour !== 'affine:divider') {
      return false;
    }
    const model = blockModels.at(-1);
    if (!model) {
      return next({ updatedBlocks: [] });
    }
    const parent = doc.getParent(model);
    if (!parent) {
      return next({ updatedBlocks: [] });
    }
    const index = parent.children.indexOf(model);
    const nextSibling = doc.getNext(model);
    let nextSiblingId = nextSibling?.id as string;
    const id = doc.addBlock('affine:divider', {}, parent, index + 1);
    if (!nextSibling) {
      nextSiblingId = doc.addBlock('affine:paragraph', {}, parent);
    }
    focusTextModel(host.std, nextSiblingId);
    const newModel = doc.getBlockById(id);
    if (!newModel) {
      return next({ updatedBlocks: [] });
    }
    return next({ updatedBlocks: [newModel] });
  };

  const focusText: Command<'updatedBlocks'> = (ctx, next) => {
    const { updatedBlocks } = ctx;
    if (!updatedBlocks || updatedBlocks.length === 0) {
      return false;
    }

    const firstNewModel = updatedBlocks[0];
    const lastNewModel = updatedBlocks[updatedBlocks.length - 1];

    const allTextUpdated = updatedBlocks.map(model =>
      onModelTextUpdated(host, model)
    );
    const selectionManager = host.selection;
    const textSelection = selectionManager.find('text');
    if (!textSelection) {
      return false;
    }
    const newTextSelection = selectionManager.create('text', {
      from: {
        blockId: firstNewModel.id,
        index: textSelection.from.index,
        length: textSelection.from.length,
      },
      to: textSelection.to
        ? {
            blockId: lastNewModel.id,
            index: textSelection.to.index,
            length: textSelection.to.length,
          }
        : null,
    });

    Promise.all(allTextUpdated)
      .then(() => {
        selectionManager.setGroup('note', [newTextSelection]);
      })
      .catch(console.error);
    return next();
  };

  const focusBlock: Command<'updatedBlocks'> = (ctx, next) => {
    const { updatedBlocks } = ctx;
    if (!updatedBlocks || updatedBlocks.length === 0) {
      return false;
    }

    const selectionManager = host.selection;

    const blockSelections = selectionManager.filter('block');
    if (blockSelections.length === 0) {
      return false;
    }
    requestAnimationFrame(() => {
      const selections = updatedBlocks.map(model => {
        return selectionManager.create('block', {
          blockId: model.id,
        });
      });

      selectionManager.setGroup('note', selections);
    });
    return next();
  };

  const [result, resultCtx] = std.command
    .chain()
    .inline((_, next) => {
      doc.captureSync();
      return next();
    })
    // update block type
    .try<'updatedBlocks'>(chain => [
      chain.inline<'updatedBlocks'>(mergeToCode),
      chain.inline<'updatedBlocks'>(appendDivider),
      chain.inline<'updatedBlocks'>((_, next) => {
        const newModels: BlockModel[] = [];
        blockModels.forEach(model => {
          if (
            !matchFlavours(model, [
              'affine:paragraph',
              'affine:list',
              'affine:code',
            ])
          ) {
            return;
          }
          if (model.flavour === flavour) {
            doc.updateBlock(model, props ?? {});
            newModels.push(model);
            return;
          }
          const newId = transformModel(model, flavour, props);
          const newModel = doc.getBlockById(newId);
          if (newModel) {
            newModels.push(newModel);
          }
        });
        return next({ updatedBlocks: newModels });
      }),
    ])
    // focus
    .try(chain => [
      chain.inline((_, next) => {
        if (['affine:code', 'affine:divider'].includes(flavour)) {
          return next();
        }
        return false;
      }),
      chain.inline(focusText),
      chain.inline(focusBlock),
      chain.inline((_, next) => next()),
    ])
    .run();

  if (!result) {
    return false;
  }

  return next({ updatedBlocks: resultCtx.updatedBlocks });
};
