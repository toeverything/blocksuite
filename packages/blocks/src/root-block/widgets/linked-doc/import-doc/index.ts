import type { DocCollection } from '@blocksuite/store';

import {
  ImportDoc,
  type OnFailHandler,
  type OnSuccessHandler,
} from './import-doc.js';

export { importHtml, importMarkDown, importNotion } from './import-doc.js';

export function showImportModal({
  abortController = new AbortController(),
  collection,
  container = document.body,
  onFail,
  onSuccess,
}: {
  abortController?: AbortController;
  collection: DocCollection;
  container?: HTMLElement;
  multiple?: boolean;
  onFail?: OnFailHandler;
  onSuccess?: OnSuccessHandler;
}) {
  const importDoc = new ImportDoc(
    collection,
    onSuccess,
    onFail,
    abortController
  );
  container.append(importDoc);
  abortController.signal.addEventListener('abort', () => importDoc.remove());
  return importDoc;
}
