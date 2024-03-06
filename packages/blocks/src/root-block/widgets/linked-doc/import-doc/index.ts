import type { Workspace } from '@blocksuite/store';

import {
  ImportDoc,
  type OnFailHandler,
  type OnSuccessHandler,
} from './import-doc.js';

export { importHtml, importMarkDown, importNotion } from './import-doc.js';

export function showImportModal({
  workspace,
  onSuccess,
  onFail,
  container = document.body,
  abortController = new AbortController(),
}: {
  workspace: Workspace;
  onSuccess?: OnSuccessHandler;
  onFail?: OnFailHandler;
  multiple?: boolean;
  container?: HTMLElement;
  abortController?: AbortController;
}) {
  const importDoc = new ImportDoc(
    workspace,
    onSuccess,
    onFail,
    abortController
  );
  container.append(importDoc);
  abortController.signal.addEventListener('abort', () => importDoc.remove());
  return importDoc;
}
