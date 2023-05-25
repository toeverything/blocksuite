import type { BaseBlockModel, Workspace } from '@blocksuite/store';
import { DisposableGroup } from '@blocksuite/store';

import { ImportPage, type OnSuccessFunc } from './import-page.js';

export function showImportModal({
  workspace,
  onSuccess,
  container = document.body,
  abortController = new AbortController(),
}: {
  workspace: Workspace;
  onSuccess?: OnSuccessFunc;
  container?: HTMLElement;
  abortController?: AbortController;
}) {
  const importPage = new ImportPage(workspace, onSuccess, abortController);
  container.appendChild(importPage);

  const disposables = new DisposableGroup();
  abortController.signal.addEventListener('abort', () => disposables.dispose());
  disposables.add(() => importPage.remove());
  disposables.addFromEvent(window, 'mousedown', (e: Event) => {
    if (e.target === importPage) return;
    abortController.abort();
  });

  return importPage;
}
