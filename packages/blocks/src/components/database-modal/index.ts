import type { Page } from '@blocksuite/store';
import { DisposableGroup } from '@blocksuite/store';

import { DatabaseModal } from './database-modal.js';

export function showDatabaseModal({
  page,
  container = document.body,
  abortController = new AbortController(),
}: {
  page: Page;
  container?: HTMLElement;
  abortController?: AbortController;
}) {
  const disposables = new DisposableGroup();
  abortController.signal.addEventListener('abort', () => disposables.dispose());

  const databaseModal = new DatabaseModal();
  databaseModal.page = page;
  databaseModal.abortController = abortController;
  // Mount
  container.appendChild(databaseModal);
  disposables.add(() => databaseModal.remove());

  return databaseModal;
}
