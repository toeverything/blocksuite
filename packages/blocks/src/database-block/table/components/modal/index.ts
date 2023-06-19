import type { BlockSuiteRoot } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { DisposableGroup } from '@blocksuite/store';

import type { DatabaseBlockModel } from '../../../database-model.js';
import { DatabaseTableViewModal } from './table-modal.js';

export function showDatabaseTableViewModal({
  page,
  root,
  model,
  container = document.body,
  abortController = new AbortController(),
}: {
  page: Page;
  root: BlockSuiteRoot;
  model: DatabaseBlockModel;
  container?: HTMLElement;
  abortController?: AbortController;
}) {
  const disposables = new DisposableGroup();
  abortController.signal.addEventListener('abort', () => disposables.dispose());

  const databaseModal = new DatabaseTableViewModal();
  databaseModal.page = page;
  databaseModal.root = root;
  databaseModal.model = model;
  databaseModal.abortController = abortController;
  // Mount
  container.appendChild(databaseModal);
  disposables.add(() => databaseModal.remove());

  return databaseModal;
}
