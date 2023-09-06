import { assertExists } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';

import type {
  AffineImageToolbarWidget,
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

  const page = root.viewStore.viewFromPath('block', [
    root.page.root.id,
  ]) as DocPageBlockComponent;

  return page;
}

function openLeditsEditor(
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

      console.log(div, blob);
      div.appendChild(app);
    },
  });
}

export const main = (root: BlockSuiteRoot) => {
  assertExists(root.page.root);

  const pageElement = getPageElement(root);

  (
    pageElement.widgetElements.imageToolbar as AffineImageToolbarWidget
  ).registerEntry({
    callback: (model, blob) => {
      openLeditsEditor(model, blob, root);
    },
    name: 'LEDITS',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.82912 16.3197L7.91758 18.4082L6.57812 19.7476C6.53121 19.7945 6.46407 19.8151 6.39891 19.8026L3.37038 19.2199C3.21286 19.1896 3.15332 18.9955 3.26674 18.8821L5.82912 16.3197Z" fill="#1E96EB"/><path fill-rule="evenodd" clip-rule="evenodd" d="M19.0095 3.51624C17.9526 2.45932 16.26 2.39465 15.1255 3.36783L7.3214 10.0624C6.35443 10.8919 6.0528 12.261 6.58168 13.42L6.73506 13.7562L5.67702 14.8142C5.30174 15.1895 5.30174 15.7979 5.67702 16.1732L8.06384 18.56C8.43912 18.9353 9.04757 18.9353 9.42285 18.56L10.4809 17.502L10.8171 17.6555C11.9761 18.1843 13.3453 17.8827 14.1747 16.9157L20.8693 9.11159C21.8425 7.9771 21.7778 6.28452 20.7209 5.22761L19.0095 3.51624ZM16.1022 4.50634C16.6416 4.04362 17.4463 4.07437 17.9489 4.5769L19.6602 6.28827C20.1628 6.79079 20.1935 7.59555 19.7308 8.13496L14.6424 14.0667L10.1705 9.59469L16.1022 4.50634ZM9.02862 10.5742L8.29803 11.2009C7.83827 11.5953 7.69486 12.2462 7.94632 12.7973L8.2979 13.5678C8.43485 13.8679 8.37953 14.233 8.13377 14.4788L7.11884 15.4937L8.74335 17.1182L9.75818 16.1034C10.004 15.8576 10.3692 15.8023 10.6693 15.9392L11.4398 16.2908C11.9909 16.5423 12.6419 16.3989 13.0362 15.9391L13.663 15.2085L9.02862 10.5742Z" fill="currentColor"/></svg>',
    title: 'Edit with LEDITS',
  });
};
