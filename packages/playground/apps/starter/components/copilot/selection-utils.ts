import { matchFlavours } from '@blocksuite/blocks/_common/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';

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

export function getSelectedTextContent(root: BlockSuiteRoot) {
  let result: string[] = [];

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
        .filter(
          model =>
            model &&
            matchFlavours(model, [
              'affine:paragraph',
              'affine:list',
              'affine:code',
            ])
        )
        .map(model => model?.text?.toString() || '');
      return next();
    })
    .run();

  return result;
}
