import type { Workspace } from '@blocksuite/store';

import { ImportDoc, type OnSuccessHandler } from './import-doc.js';

export { importHtml, importMarkDown, importNotion } from './import-doc.js';

/**
 * @deprecated Waiting for migration
 * See https://github.com/toeverything/blocksuite/issues/3316
 */
export function showImportModal({
  workspace,
  onSuccess,
  container = document.body,
  abortController = new AbortController(),
}: {
  workspace: Workspace;
  onSuccess?: OnSuccessHandler;
  multiple?: boolean;
  container?: HTMLElement;
  abortController?: AbortController;
}) {
  const importDoc = new ImportDoc(workspace, onSuccess, abortController);
  container.appendChild(importDoc);
  abortController.signal.addEventListener('abort', () => importDoc.remove());
  return importDoc;
}
