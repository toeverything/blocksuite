import type { Command } from '@blocksuite/block-std';
import type { EditorHost } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

import {
  assertFlavours,
  asyncFocusRichText,
  asyncSetInlineRange,
} from '../../_common/utils/index.js';
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
  const host = std.host as EditorHost;
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
    if (flavour !== 'affine:code') {
      return false;
    }
    const id = mergeToCodeModel(blockModels);
    const model = doc.getBlockById(id);
    if (!model) {
      throw new Error('Failed to get model after merge code block!');
    }
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
    asyncFocusRichText(host, nextSiblingId)?.catch(console.error);
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
        path: textSelection.from.path.slice(0, -1).concat(firstNewModel.id),
        index: textSelection.from.index,
        length: textSelection.from.length,
      },
      to: textSelection.to
        ? {
            path: textSelection.to.path.slice(0, -1).concat(lastNewModel.id),
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
          path: blockSelections[0].path.slice(0, -1).concat(model.id),
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
          assertFlavours(model, [
            'affine:paragraph',
            'affine:list',
            'affine:code',
          ]);
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

declare global {
  namespace BlockSuite {
    interface CommandContext {
      updatedBlocks?: BlockModel[];
    }

    interface Commands {
      updateBlockType: typeof updateBlockType;
    }
  }
}
