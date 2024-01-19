/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  DocPageBlockComponent,
  EdgelessPageBlockComponent,
  SurfaceBlockComponent,
  SurfaceBlockModel,
} from '@blocksuite/blocks';
import type { Page } from '@blocksuite/store';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { AffineEditorContainer } from '../../index.js';

export function getSurface(page: Page, editor: AffineEditorContainer) {
  const surfaceModel = page.getBlockByFlavour('affine:surface');

  return editor.host!.view.viewFromPath('block', [
    page.root!.id,
    surfaceModel[0]!.id,
  ]) as SurfaceBlockComponent;
}

export function getSurfaceModel(page: Page) {
  return page.getBlockByFlavour('affine:surface')[0] as SurfaceBlockModel;
}

export function getPageRootBlock(
  page: Page,
  editor: AffineEditorContainer,
  mode: 'page'
): DocPageBlockComponent;
export function getPageRootBlock(
  page: Page,
  editor: AffineEditorContainer,
  mode: 'edgeless'
): EdgelessPageBlockComponent;
export function getPageRootBlock(
  page: Page,
  editor: AffineEditorContainer,
  _?: 'edgeless' | 'page'
) {
  return editor.host!.view.viewFromPath('block', [page.root!.id]) as
    | EdgelessPageBlockComponent
    | DocPageBlockComponent;
}

export function addNote(page: Page, props: Record<string, any> = {}) {
  const noteId = page.addBlock(
    'affine:note',
    {
      xywh: '[0, 0, 800, 100]',
      ...props,
    },
    page.root
  );

  page.addBlock('affine:paragraph', {}, noteId);

  return noteId;
}
