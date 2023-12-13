/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  DocPageBlockComponent,
  EdgelessPageBlockComponent,
  SurfaceBlockComponent,
} from '@blocksuite/blocks';
import type { Page } from '@blocksuite/store';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { AffineEditorContainer } from '../../src/index.js';

export function getSurface(page: Page, editor: AffineEditorContainer) {
  const surfaceModel = page.getBlockByFlavour('affine:surface');

  return editor.root!.view.viewFromPath('block', [
    page.root!.id,
    surfaceModel[0]!.id,
  ]) as SurfaceBlockComponent;
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
  return editor.root!.view.viewFromPath('block', [page.root!.id]) as
    | EdgelessPageBlockComponent
    | DocPageBlockComponent;
}

const defaultProps = {
  shape: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rect: (props: any) => {
      return {
        xywh: '[10, 10, 100, 100]',
        strokeColor: 'red',
        fillColor: '--affine-palette-transparent',
        filled: props.fillColor === '--affine-palette-transparent',
        radius: 0,
        strokeWidth: 4,
        strokeStyle: 'solid',
        shapeStyle: 'General',
      };
    },
  } as Record<string, any>,
};

export function addElement(
  type: string,
  props: Record<string, any>,
  surface: SurfaceBlockComponent
) {
  props =
    type === 'shape'
      ? Object.assign(
          props,
          defaultProps.shape[props.shapeType as string]?.(props) ?? props
        )
      : props;
  return surface.addElement(type as any, props);
}

export function addNote(page: Page, props: Record<string, any> = {}) {
  const noteId = page.addBlock(
    'affine:note',
    {
      xywh: '[0, 0, 100, 100]',
      ...props,
    },
    page.root
  );
  page.addBlock('affine:paragraph', {}, noteId);

  return noteId;
}
