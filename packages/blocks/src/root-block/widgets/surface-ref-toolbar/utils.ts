import type { CanvasRenderer } from '@blocksuite/affine-block-surface';
import type { EditorHost } from '@blocksuite/block-std';

import { assertExists, Bound } from '@blocksuite/global/utils';

import type { SurfaceRefBlockComponent } from '../../../surface-ref-block/surface-ref-block.js';

import { ExportManager } from '../../../_common/export-manager/export-manager.js';
import { isTopLevelBlock } from '../../../root-block/edgeless/utils/query.js';

export const edgelessToBlob = async (
  host: EditorHost,
  options: {
    surfaceRefBlock: SurfaceRefBlockComponent;
    surfaceRenderer: CanvasRenderer;
    edgelessElement: BlockSuite.EdgelessModel;
  }
): Promise<Blob> => {
  const { edgelessElement } = options;
  const exportManager = host.std.get(ExportManager);
  const bound = Bound.deserialize(edgelessElement.xywh);
  const isBlock = isTopLevelBlock(edgelessElement);

  return exportManager
    .edgelessToCanvas(
      options.surfaceRenderer,
      bound,
      undefined,
      isBlock ? [edgelessElement] : undefined,
      isBlock ? undefined : [edgelessElement],
      { zoom: options.surfaceRenderer.viewport.zoom }
    )
    .then(canvas => {
      assertExists(canvas);
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          blob => (blob ? resolve(blob) : reject(null)),
          'image/png'
        );
      });
    });
};

export const writeImageBlobToClipboard = async (blob: Blob) => {
  // @ts-ignore
  if (window.apis?.clipboard?.copyAsImageFromString) {
    // @ts-ignore
    await window.apis.clipboard?.copyAsImageFromString(blob);
  } else {
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
  }
};
