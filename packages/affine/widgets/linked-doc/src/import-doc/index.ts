import type { Schema, Workspace } from '@blocksuite/store';

import {
  ImportDoc,
  type OnFailHandler,
  type OnSuccessHandler,
} from './import-doc.js';

export function showImportModal({
  schema,
  collection,
  onSuccess,
  onFail,
  container = document.body,
  abortController = new AbortController(),
}: {
  schema: Schema;
  collection: Workspace;
  onSuccess?: OnSuccessHandler;
  onFail?: OnFailHandler;
  multiple?: boolean;
  container?: HTMLElement;
  abortController?: AbortController;
}) {
  const importDoc = new ImportDoc(
    collection,
    schema,
    onSuccess,
    onFail,
    abortController
  );
  container.append(importDoc);
  abortController.signal.addEventListener('abort', () => importDoc.remove());
  return importDoc;
}
