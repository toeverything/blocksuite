import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';

import { type EdgelessElement } from '../../../_common/types.js';
import { isTopLevelBlock } from '../../../page-block/edgeless/utils/query.js';
import type { Renderer } from '../../../surface-block/renderer.js';
import { Bound } from '../../../surface-block/utils/bound.js';
import type { SurfaceRefBlockComponent } from '../../../surface-ref-block/surface-ref-block.js';
import type { PageService } from '../../page-service.js';

export const edgelessToBlob = async (
  host: EditorHost,
  options: {
    surfaceRefBlock: SurfaceRefBlockComponent;
    surfaceRenderer: Renderer;
    edgelessElement: EdgelessElement;
    blockContainer: HTMLElement;
  }
): Promise<Blob> => {
  const { edgelessElement, blockContainer } = options;
  const pageService = host.spec.getService('affine:page') as PageService;
  const exportManager = pageService.exportManager;
  const bound = Bound.deserialize(edgelessElement.xywh);
  const isBlock = isTopLevelBlock(edgelessElement);

  return exportManager
    .edgelessToCanvas(
      options.surfaceRenderer,
      bound,
      model => {
        console.log('blockContainer', blockContainer);
        console.log('model', model);
        return blockContainer.querySelector(
          `[data-portal-reference-block-id="${model.id}"]`
        );
      },
      undefined,
      isBlock ? [edgelessElement] : undefined,
      isBlock ? undefined : [edgelessElement],
      { zoom: options.surfaceRenderer.zoom }
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
