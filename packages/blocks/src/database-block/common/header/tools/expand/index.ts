import type { EventName, UIEventHandler } from '@blocksuite/block-std';
import type { Disposable } from '@blocksuite/global/utils';
import { DisposableGroup, Slot } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { Text } from '@blocksuite/store';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { DataViewSelection } from '../../../../../__internal__/index.js';
import { createModal } from '../../../../../components/menu/index.js';
import { renderUniLit } from '../../../../../components/uni-component/uni-component.js';
import { ExpandWideIcon } from '../../../../../icons/index.js';
import type { DatabaseBlockModel } from '../../../../database-model.js';
import { viewRendererManager } from '../../../data-view.js';
import type { DataViewManager } from '../../../data-view-manager.js';
import { DatabaseTableViewFullScreen } from './table-full-screen-modal.js';

export function showDatabaseTableViewModal({
  view,
}: {
  view: DataViewManager;
}) {
  const viewComponent = new DataViewNative();
  viewComponent.view = view;
  const modal = createModal();
  const close = () => {
    modal.remove();
  };
  const div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.left = '0';
  div.style.right = '0';
  div.style.width = '80%';

  modal.onclick = close;
  modal.append(viewComponent);
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
@customElement('expand-database-block-modal')
export class ExpandDatabaseBlockModal extends WithDisposable(
  ShadowlessElement
) {
  expandDatabase = () => {};
  protected override render(): unknown {
    return html`<div
      @click="${this.expandDatabase}"
      class="dv-icon-20 dv-pd-2 dv-hover dv-round-4"
      style="display:flex;"
    >
      ${ExpandWideIcon}
    </div>`;
  }
}

@customElement('data-view-native')
export class DataViewNative extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  view!: DataViewManager;
  selectionUpdated: Slot<DataViewSelection | undefined> = new Slot();
  setSelection: (selection?: DataViewSelection) => void = selection => {
    this.selectionUpdated.emit(selection);
  };
  bindHotkey: (hotkeys: Record<string, UIEventHandler>) => Disposable =
    hotkeys => {};
  handleEvent: (name: EventName, handler: UIEventHandler) => Disposable = (
    name,
    handler
  ) => {
    this.disposables.addFromEvent(this, name, handler);
  };
  protected override render(): unknown {
    const uni = viewRendererManager.getView(this.view.type).view;
    return renderUniLit(uni, {
      titleText: new Text(),
      selectionUpdated: this.selectionUpdated,
      setSelection: this.setSelection,
      bindHotkey: this.bindHotkey,
      handleEvent: this.handleEvent,
      view: this.view,
    });
  }
}
