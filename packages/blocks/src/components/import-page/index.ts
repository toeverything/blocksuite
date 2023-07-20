import type { Workspace } from '@blocksuite/store';
import { DisposableGroup } from '@blocksuite/store';

import { ImportPage, type OnSuccessHandler } from './import-page.js';

export { importHtml, importMarkDown, importNotion } from './import-page.js';

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
  const importPage = new ImportPage(workspace, onSuccess, abortController);
  container.appendChild(importPage);

  const disposables = new DisposableGroup();
  abortController.signal.addEventListener('abort', () => disposables.dispose());
  disposables.add(() => importPage.remove());
  disposables.addFromEvent(window, 'mousedown', (e: Event) => {
    if (e.target === importPage || importPage.loading()) return;
    abortController.abort();
  });

  return importPage;
}
