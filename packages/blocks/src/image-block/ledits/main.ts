// FIXME: this should be move to more appropriate place after extension system has completed
import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';

import type { DocPageBlockComponent } from '../../page-block/doc/doc-page-block.js';
import type { AffineModalWidget } from '../../page-block/widgets/modal/modal.js';
import type { ImageBlockComponent } from '../image-block.js';
import { GradioApp } from './gradio-app.js';

function createGradioApp() {
  const app = new GradioApp();

  return app;
}

function getPageElement(host: EditorHost) {
  assertExists(host.page.root?.id);

  const page = host.view.viewFromPath('block', [
    host.page.root.id,
  ]) as DocPageBlockComponent;

  return page;
}

export function openLeditsEditor(blockElement: ImageBlockComponent) {
  const { host, model, blob } = blockElement;
  if (!blob) {
    return;
  }
  const pageElement = getPageElement(host);
  const app = createGradioApp();
  const modal = (
    pageElement.widgetElements['affine-modal-widget'] as AffineModalWidget
  ).open({
    footer: [
      {
        text: 'Cancel',
        onClick: () => {
          modal.close();
        },
      },
      {
        type: 'primary',
        text: 'Save',
        onClick: async () => {
          const newBlob = await app.exportImage();

          if (!newBlob || newBlob === blob) {
            modal.close();
          }

          const blobManager = model.page.blob;
          const sourceId = await blobManager.set(newBlob);
          model.page.updateBlock(model, {
            sourceId,
          });
          modal.close();
        },
      },
    ],
    entry(div) {
      app.imageBlob = blob;
      div.appendChild(app);
    },
  });
}
