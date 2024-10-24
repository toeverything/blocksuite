import type { DocCollection } from '@blocksuite/store';

import {
  ImportDoc,
  type OnFailHandler,
  type OnSuccessHandler,
} from './import-doc.js';

export function showImportModal({
  collection,
  onSuccess,
  onFail,
  container = document.body,
  abortController = new AbortController(),
}: {
  collection: DocCollection;
  onSuccess?: OnSuccessHandler;
  onFail?: OnFailHandler;
  multiple?: boolean;
  container?: HTMLElement;
  abortController?: AbortController;
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
