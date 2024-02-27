// FIXME: this should be move to more appropriate place after extension system has completed
import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';

import type { PageRootBlockComponent } from '../../root-block/page/page-root-block.js';
import type { AffineModalWidget } from '../../root-block/widgets/modal/modal.js';
import type { ImageBlockComponent } from '../image-block.js';
import { GradioApp } from './gradio-app.js';

function createGradioApp() {
  const app = new GradioApp();

  return app;
}

function getRootElement(host: EditorHost) {
  assertExists(host.doc.root?.id);

  const rootElement = host.view.viewFromPath('block', [
    host.doc.root.id,
  ]) as PageRootBlockComponent;

  return rootElement;
}

export function openLeditsEditor(blockElement: ImageBlockComponent) {
  const { host, model, blob } = blockElement;
  if (!blob) {
    return;
  }
  const rootElement = getRootElement(host);
  const app = createGradioApp();
  const modal = (
    rootElement.widgetElements['affine-modal-widget'] as AffineModalWidget
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

          const blobManager = model.doc.blob;
          const sourceId = await blobManager.set(newBlob);
          model.doc.updateBlock(model, {
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
