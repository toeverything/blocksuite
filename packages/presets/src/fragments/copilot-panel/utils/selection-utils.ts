import type { PageService } from '@blocksuite/blocks';
import {
  BlocksUtils,
  type EdgelessBlock,
  EdgelessPageService,
  type FrameBlockModel,
  type ImageBlockModel,
  type SurfaceBlockComponent,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import { Slice } from '@blocksuite/store';

import { getMarkdownFromSlice } from './markdown-utils.js';

export const getPageService = (host: EditorHost) => {
  return host.std.spec.getService('affine:page') as PageService;
};

export function getEdgelessPageBlockFromEditor(editor: EditorHost) {
  const edgelessPage = editor.getElementsByTagName('affine-edgeless-page')[0];
  if (!edgelessPage) {
    alert('Please switch to edgeless mode');
    throw new Error('Please open switch to edgeless mode');
  }
  return edgelessPage;
}
export function getEdgelessService(editor: EditorHost) {
  const service = editor.std.spec.getService('affine:page');
  if (service instanceof EdgelessPageService) {
    return service;
  }
  alert('Please switch to edgeless mode');
  throw new Error('Please open switch to edgeless mode');
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
  const edgelessPage = getEdgelessPageBlockFromEditor(editor);
  const { notes, frames, shapes, images } = BlocksUtils.splitElements(
    edgelessPage.service.frame.getElementsInFrame(frame, true)
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
  const slice = Slice.fromModels(
    editorHost.std.page,
    getPageService(editorHost).selectedModels
  );
  return getMarkdownFromSlice(editorHost, slice);
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
  const edgelessPage = getEdgelessPageBlockFromEditor(editor);
  const elements = edgelessPage.service.frame.getElementsInFrame(frame, false);
  const image = elements.find(ele => {
    if (!BlocksUtils.isCanvasElement(ele)) {
      return (ele as EdgelessBlock).flavour === 'affine:image';
    }
    return false;
  }) as ImageBlockModel | undefined;
  return image?.id;
};
