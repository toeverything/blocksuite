// FIXME: this should be move to more appropriate place after extension system has completed
import { assertExists } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';

import type {
  AffineModalWidget,
  DocPageBlockComponent,
  ImageBlockModel,
} from '../../index.js';
import { GradioApp } from './gradio-app.js';

function createGradioApp() {
  const app = new GradioApp();

  return app;
}

function getPageElement(root: BlockSuiteRoot) {
  assertExists(root.page.root?.id);

  const page = root.view.viewFromPath('block', [
    root.page.root.id,
  ]) as DocPageBlockComponent;

  return page;
}

export function openLeditsEditor(
  model: ImageBlockModel,
  blob: Blob,
  root: BlockSuiteRoot
) {
  const pageElement = getPageElement(root);
  const app = createGradioApp();
  const modal = (pageElement.widgetElements.modal as AffineModalWidget).open({
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

          if (newBlob === blob) {
            modal.close();
          }

          const blobManager = model.page.blobs;
          blobManager.set(newBlob).then(sourceId => {
            model.page.updateBlock(model, {
              sourceId,
            });
            modal.close();
          });
        },
      },
    ],
    entry(div) {
      app.imageBlob = blob;
      div.appendChild(app);
    },
  });
}
