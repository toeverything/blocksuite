import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';

import { type EdgelessElement } from '../../../_common/types.js';
import { ContentParser } from '../../../content-parser.js';
import { isTopLevelBlock } from '../../../page-block/edgeless/utils/query.js';
import type { Renderer } from '../../../surface-block/canvas-renderer/renderer.js';
import { Bound } from '../../../surface-block/utils/bound.js';
import type { SurfaceRefBlockComponent } from '../../../surface-ref-block/surface-ref-block.js';

export const edgelessToBlob = async (
  host: EditorHost,
  page: Page,
  options: {
    surfaceRefBlock: SurfaceRefBlockComponent;
    surfaceRenderer: Renderer;
    edgelessElement: EdgelessElement;
    blockContainer: HTMLElement;
  }
): Promise<Blob> => {
  const { edgelessElement, blockContainer } = options;
  const parser = new ContentParser(host, page);
  const bound = Bound.deserialize(edgelessElement.xywh);
  const isBlock = isTopLevelBlock(edgelessElement);

  return parser
    .edgelessToCanvas(
      options.surfaceRenderer,
      bound,
      undefined,
      isBlock ? [edgelessElement] : undefined,
      isBlock ? undefined : [edgelessElement],
      id => blockContainer.querySelector(`[portal-reference-block-id="${id}"]`),
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
