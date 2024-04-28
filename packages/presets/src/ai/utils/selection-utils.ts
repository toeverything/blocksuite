import type { EditorHost } from '@blocksuite/block-std';
import type {
  EdgelessBlock,
  FrameBlockModel,
  ImageBlockModel,
  SurfaceBlockComponent,
} from '@blocksuite/blocks';
import { BlocksUtils, EdgelessRootService } from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import { type DraftModel, Slice, toDraftModel } from '@blocksuite/store';

import { getMarkdownFromSlice } from './markdown-utils.js';

export const getRootService = (host: EditorHost) => {
  return host.std.spec.getService('affine:page');
};

export function getEdgelessRootFromEditor(editor: EditorHost) {
  const edgelessRoot = editor.getElementsByTagName('affine-edgeless-root')[0];
  if (!edgelessRoot) {
    alert('Please switch to edgeless mode');
    throw new Error('Please open switch to edgeless mode');
  }
  return edgelessRoot;
}
export function getEdgelessService(editor: EditorHost) {
  const rootService = editor.std.spec.getService('affine:page');
  if (rootService instanceof EdgelessRootService) {
    return rootService;
  }
  alert('Please switch to edgeless mode');
  throw new Error('Please open switch to edgeless mode');
}

export async function selectedToCanvas(editor: EditorHost) {
  const edgelessRoot = getEdgelessRootFromEditor(editor);
  const { notes, frames, shapes, images } = BlocksUtils.splitElements(
    edgelessRoot.service.selection.elements
  );
  if (notes.length + frames.length + images.length + shapes.length === 0) {
    return;
  }
  const canvas = await edgelessRoot.clipboardController.toCanvas(
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
  const edgelessRoot = getEdgelessRootFromEditor(editor);
  const { notes, frames, shapes, images } = BlocksUtils.splitElements(
    edgelessRoot.service.frame.getElementsInFrame(frame, true)
  );
  if (notes.length + frames.length + images.length + shapes.length === 0) {
    return;
  }
  const canvas = await edgelessRoot.clipboardController.toCanvas(
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

export function getSelectedModels(editorHost: EditorHost) {
  const chain = editorHost.std.command.chain();
  const [_, ctx] = chain
    .getSelectedModels({
      types: ['block', 'text'],
    })
    .run();
  const { selectedModels } = ctx;
  return selectedModels;
}

function traverse(model: DraftModel, drafts: DraftModel[]) {
  const isDatabase = model.flavour === 'affine:database';
  const children = isDatabase
    ? model.children
    : model.children.filter(child => {
        const idx = drafts.findIndex(m => m.id === child.id);
        return idx >= 0;
      });

  children.forEach(child => {
    const idx = drafts.findIndex(m => m.id === child.id);
    if (idx >= 0) {
      drafts.splice(idx, 1);
    }
    traverse(child, drafts);
  });
  model.children = children;
}

export async function getSelectedTextContent(editorHost: EditorHost) {
  const selectedModels = getSelectedModels(editorHost);
  assertExists(selectedModels);

  // Currently only filter out images and databases
  const selectedTextModels = selectedModels.filter(
    model =>
      !BlocksUtils.matchFlavours(model, ['affine:image', 'affine:database'])
  );
  const drafts = selectedTextModels.map(toDraftModel);
  drafts.forEach(draft => traverse(draft, drafts));
  const slice = Slice.fromModels(editorHost.std.doc, drafts);
  return getMarkdownFromSlice(editorHost, slice);
}

export const stopPropagation = (e: Event) => {
  e.stopPropagation();
};

export function getSurfaceElementFromEditor(editor: EditorHost) {
  const { doc } = editor;
  const surfaceModel = doc.getBlockByFlavour('affine:surface')[0];
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
  const edgelessRoot = getEdgelessRootFromEditor(editor);
  const elements = edgelessRoot.service.frame.getElementsInFrame(frame, false);
  const image = elements.find(ele => {
    if (!BlocksUtils.isCanvasElement(ele)) {
      return (ele as EdgelessBlock).flavour === 'affine:image';
    }
    return false;
  }) as ImageBlockModel | undefined;
  return image?.id;
};

export const getSelections = (
  host: EditorHost,
  mode: 'flat' | 'highest' = 'flat'
) => {
  const [_, data] = host.command
    .chain()
    .tryAll(chain => [chain.getTextSelection(), chain.getBlockSelections()])
    .getSelectedBlocks({ types: ['text', 'block'], mode })
    .run();

  return data;
};

export const getSelectedImagesAsBlobs = async (host: EditorHost) => {
  const [_, data] = host.command
    .chain()
    .tryAll(chain => [
      chain.getTextSelection(),
      chain.getBlockSelections(),
      chain.getImageSelections(),
    ])
    .getSelectedBlocks({
      types: ['image'],
    })
    .run();

  const blobs = await Promise.all(
    data.currentBlockSelections?.map(async s => {
      const sourceId = (host.doc.getBlock(s.blockId)?.model as ImageBlockModel)
        ?.sourceId;
      if (!sourceId) return null;
      const blob = await (sourceId ? host.doc.blob.get(sourceId) : null);
      if (!blob) return null;
      return new File([blob], sourceId);
    }) ?? []
  );
  return blobs.filter((blob): blob is File => !!blob);
};

export const getSelectedNoteAnchor = (host: EditorHost, id: string) => {
  return host.querySelector(`[data-portal-block-id="${id}"] .note-background`);
};
