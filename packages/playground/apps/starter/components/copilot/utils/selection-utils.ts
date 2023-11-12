import { matchFlavours } from '@blocksuite/blocks/_common/utils';
import type { BlockElement, BlockSuiteRoot } from '@blocksuite/lit';
import { type BaseBlockModel, Slice } from '@blocksuite/store';

import { getMarkdownFromSlice } from './markdown-utils';

export function hasSelectedTextContent(root: BlockSuiteRoot) {
  let result = false;

  root.std.command
    .pipe()
    .getBlockSelections()
    .inline((ctx, next) => {
      const selections = ctx.currentBlockSelections;
      if (!selections) return;

      result = selections
        .map(
          selection => ctx.std.view.viewFromPath('block', selection.path)?.model
        )
        .some(
          model =>
            model &&
            matchFlavours(model, [
              'affine:paragraph',
              'affine:list',
              'affine:code',
            ])
        );
      return next();
    })
    .run();

  return result;
}

export async function getSelectedTextSlice(root: BlockSuiteRoot) {
  let models: BaseBlockModel[] = [];

  root.std.command
    .pipe()
    .getBlockSelections()
    .inline((ctx, next) => {
      const selections = ctx.currentBlockSelections;
      if (!selections) return;

      models = selections
        .map(
          selection => ctx.std.view.viewFromPath('block', selection.path)?.model
        )
        .filter(
          (model): model is BaseBlockModel<object> =>
            model !== undefined &&
            matchFlavours(model, [
              'affine:paragraph',
              'affine:list',
              'affine:code',
            ])
        );

      return next();
    })
    .run();

  return Slice.fromModels(root.std.page, models);
}

export async function getSelectedBlocks(root: BlockSuiteRoot) {
  let blocks: BlockElement[] = [];

  root.std.command
    .pipe()
    .getBlockSelections()
    .inline((ctx, next) => {
      const selections = ctx.currentBlockSelections;
      if (!selections) return;

      blocks = selections
        .map(selection => ctx.std.view.viewFromPath('block', selection.path))
        .filter(
          (block): block is BlockElement =>
            block !== null &&
            matchFlavours(block.model, [
              'affine:paragraph',
              'affine:list',
              'affine:code',
            ])
        );

      return next();
    })
    .run();

  return blocks;
}

export async function getSelectedTextContent(root: BlockSuiteRoot) {
  const slice = await getSelectedTextSlice(root);
  return await getMarkdownFromSlice(root, slice);
}
