import type { BlockSuiteRoot } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { DisposableGroup } from '@blocksuite/store';

import type { DatabaseBlockModel } from '../../../database-model.js';
import { DatabaseTableViewFullScreen } from './table-full-screen-modal.js';
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

  const modal = new DatabaseTableViewModal();
  modal.page = page;
  modal.root = root;
  modal.model = model;
  modal.abortController = abortController;
  // Mount
  container.appendChild(modal);
  disposables.add(() => modal.remove());

  return modal;
}

export function showDatabaseTableViewFullModal({
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

  const modal = new DatabaseTableViewFullScreen();
  modal.page = page;
  modal.root = root;
  modal.model = model;
  modal.abortController = abortController;
  // Mount
  container.appendChild(modal);
  disposables.add(() => modal.remove());

  return modal;
}
