import { BlocksUtils } from '@blocksuite/blocks';
import type { BlockElement, EditorHost } from '@blocksuite/lit';
import { type BaseBlockModel, Slice } from '@blocksuite/store';

import type { AffineEditorContainer } from '../../../editors/index.js';
import { getMarkdownFromSlice } from './markdown-utils.js';
import { getEdgelessPageBlockFromEditor } from './mind-map-utils.js';

export function hasSelectedTextContent(host: EditorHost) {
  let result = false;

  host.std.command
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
            BlocksUtils.matchFlavours(model, [
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

export async function getSelectedTextSlice(host: EditorHost) {
  let models: BaseBlockModel[] = [];

  host.std.command
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
            BlocksUtils.matchFlavours(model, [
              'affine:paragraph',
              'affine:list',
              'affine:code',
            ])
        );

      return next();
    })
    .run();

  return Slice.fromModels(host.std.page, models);
}

export async function getSelectedBlocks(host: EditorHost) {
  let blocks: BlockElement[] = [];

  host.std.command
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
            BlocksUtils.matchFlavours(block.model, [
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

export async function selectedToCanvas(editor: AffineEditorContainer) {
  const edgelessPage = getEdgelessPageBlockFromEditor(editor);
  const { notes, frames, shapes, images } = BlocksUtils.splitElements(
    edgelessPage.selectionManager.elements
  );
  if (notes.length + frames.length + images.length + shapes.length === 0) {
    return;
  }
  const canvas = await edgelessPage.clipboardController.toCanvas(
    [...notes, ...frames, ...images],
    shapes
  );
  if (!canvas) {
    return;
  }
  return canvas;
}

export async function selectedToPng(editor: AffineEditorContainer) {
  return (await selectedToCanvas(editor))?.toDataURL('image/png');
}

export async function getSelectedTextContent(host: EditorHost) {
  const slice = await getSelectedTextSlice(host);
  return await getMarkdownFromSlice(host, slice);
}

export const stopPropagation = (e: Event) => {
  e.stopPropagation();
};
