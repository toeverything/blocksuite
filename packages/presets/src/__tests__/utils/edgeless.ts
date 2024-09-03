/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  EdgelessRootBlockComponent,
  PageRootBlockComponent,
  SurfaceBlockComponent,
} from '@blocksuite/blocks';
import type { Doc } from '@blocksuite/store';

import type { AffineEditorContainer } from '../../index.js';

export function getSurface(doc: Doc, editor: AffineEditorContainer) {
  const surfaceModel = doc.getBlockByFlavour('affine:surface');

  return editor.host!.view.getBlock(
    surfaceModel[0]!.id
  ) as SurfaceBlockComponent;
}

export function getDocRootBlock(
  doc: Doc,
  editor: AffineEditorContainer,
  mode: 'page'
): PageRootBlockComponent;
export function getDocRootBlock(
  doc: Doc,
  editor: AffineEditorContainer,
  mode: 'edgeless'
): EdgelessRootBlockComponent;
export function getDocRootBlock(
  doc: Doc,
  editor: AffineEditorContainer,
  _?: 'edgeless' | 'page'
) {
  return editor.host!.view.getBlock(doc.root!.id) as
    | EdgelessRootBlockComponent
    | PageRootBlockComponent;
}

export function addNote(doc: Doc, props: Record<string, any> = {}) {
  const noteId = doc.addBlock(
    'affine:note',
    {
      xywh: '[0, 0, 800, 100]',
      ...props,
    },
    doc.root
  );

  doc.addBlock('affine:paragraph', {}, noteId);

  return noteId;
}
