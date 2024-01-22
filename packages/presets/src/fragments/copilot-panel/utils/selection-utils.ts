import type {
  EdgelessBlock,
  FrameBlockModel,
  ImageBlockModel,
} from '@blocksuite/blocks';
import { BlocksUtils, type SurfaceBlockComponent } from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement, EditorHost } from '@blocksuite/lit';
import { type BlockModel, Slice } from '@blocksuite/store';

import { getMarkdownFromSlice } from './markdown-utils.js';

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
  let models: BlockModel[] = [];

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
          (model): model is BlockModel<object> =>
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

export function getEdgelessPageBlockFromEditor(editor: EditorHost) {
  const edgelessPage = editor.getElementsByTagName('affine-edgeless-page')[0];
  if (!edgelessPage) {
    alert('Please switch to edgeless mode');
    throw new Error('Please open switch to edgeless mode');
  }
  return edgelessPage;
}

export async function selectedToCanvas(editor: EditorHost) {
  const edgelessPage = getEdgelessPageBlockFromEditor(editor);
  const { notes, frames, shapes, images } = BlocksUtils.splitElements(
    edgelessPage.service.selection.elements
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

export async function frameToCanvas(
  frame: FrameBlockModel,
  editor: EditorHost
) {
  const surface = getSurfaceElementFromEditor(editor);
  const edgelessPage = getEdgelessPageBlockFromEditor(editor);
  const { notes, frames, shapes, images } = BlocksUtils.splitElements(
    surface.frame.getElementsInFrame(frame, true)
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

export async function selectedToPng(editor: EditorHost) {
  return (await selectedToCanvas(editor))?.toDataURL('image/png');
}

export async function getSelectedTextContent(editorHost: EditorHost) {
  const slice = await getSelectedTextSlice(editorHost);
  return await getMarkdownFromSlice(editorHost, slice);
}

export const stopPropagation = (e: Event) => {
  e.stopPropagation();
};

export function getSurfaceElementFromEditor(editor: EditorHost) {
  const { page } = editor;
  const surfaceModel = page.getBlockByFlavour('affine:surface')[0];
  assertExists(surfaceModel);

  const surfaceId = surfaceModel.id;
  const surfaceElement = editor.querySelector(
    `affine-surface[data-block-id="${surfaceId}"]`
  ) as SurfaceBlockComponent;
  assertExists(surfaceElement);

  return surfaceElement;
}

export const getFirstImageInFrame = (
  frame: FrameBlockModel,
  editor: EditorHost
) => {
  const surface = getSurfaceElementFromEditor(editor);
  const elements = surface.frame.getElementsInFrame(frame, false);
  const image = elements.find(ele => {
    if (!BlocksUtils.isCanvasElement(ele)) {
      return (ele as EdgelessBlock).flavour === 'affine:image';
    }
    return false;
  }) as ImageBlockModel | undefined;
  return image?.id;
};
