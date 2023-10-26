import { assertExists } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';

import { CLIPBOARD_MIMETYPE } from '../../../_legacy/clipboard/utils/pure.js';
import { ContentParser } from '../../../content-parser.js';
import type { SurfaceRefBlockComponent } from '../../../index.js';
import { Bound, type EdgelessElement, type Renderer } from '../../../index.js';
import { isTopLevelBlock } from '../../../page-block/edgeless/utils/query.js';

export const edgelessToBlob = async (
  page: Page,
  options: {
    surfaceRefBlock: SurfaceRefBlockComponent;
    surfaceRenderer: Renderer;
    edgelessElement: EdgelessElement;
    blockContainer: HTMLElement;
  }
): Promise<Blob> => {
  const { edgelessElement, blockContainer } = options;
  const parser = new ContentParser(page);
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
          CLIPBOARD_MIMETYPE.IMAGE_PNG
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
