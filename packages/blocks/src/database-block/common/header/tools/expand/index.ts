import type { EventName, UIEventHandler } from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
import type { Disposable } from '@blocksuite/global/utils';
import { DisposableGroup, Slot } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { DataViewSelection } from '../../../../../__internal__/index.js';
import { createModal } from '../../../../../components/menu/index.js';
import { ExpandWideIcon } from '../../../../../icons/index.js';
import type { DatabaseBlockComponent } from '../../../../database-block.js';
import type { DatabaseBlockModel } from '../../../../database-model.js';
import { DatabaseSelection } from '../../../selection.js';
import { DatabaseTableViewFullScreen } from './table-full-screen-modal.js';

export function showDatabasePreviewModal({
  databaseBlock,
}: {
  databaseBlock: DatabaseBlockComponent;
}) {
  const viewComponent = new DatabaseBlockModalPreview();
  viewComponent.database = databaseBlock;
  const modal = createModal();
  const close = () => {
    modal.remove();
  };
  const div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.padding = '12px';
  div.style.borderRadius = '8px';
  div.style.left = '0';
  div.style.right = '0';
  div.style.margin = 'auto';
  div.style.marginTop = '20px';
  div.style.width = '80%';
  div.style.boxShadow = 'var(--affine-shadow-1)';
  div.style.backgroundColor = 'var(--affine-background-primary-color)';
  div.append(viewComponent);
  div.onclick = e => {
    e.stopPropagation();
  };
  modal.onclick = close;
  modal.append(div);
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
  expandDatabase = () => {
    const database = this.closest('affine-database');
    if (database) {
      showDatabasePreviewModal({
        databaseBlock: database,
      });
    }
  };

  protected override render(): unknown {
    return html` <div
      @click="${this.expandDatabase}"
      class="dv-icon-20 dv-pd-2 dv-hover dv-round-4"
      style="display:flex;"
    >
      ${ExpandWideIcon}
    </div>`;
  }
}

@customElement('database-block-modal-preview')
export class DatabaseBlockModalPreview extends WithDisposable(
  ShadowlessElement
) {
  path = ['modal', 'preview'];
  @property({ attribute: false })
  database!: DatabaseBlockComponent;

  public override connectedCallback() {
    super.connectedCallback();
    this.database.selection.slots.changed.on(selections => {
      const selection = selections.find(v => {
        return PathFinder.equals(v.path, this.path);
      });
      if (selection && selection instanceof DatabaseSelection) {
        this.selectionUpdated.emit(selection.viewSelection);
      } else {
        this.selectionUpdated.emit(undefined);
      }
    });
  }

  selectionUpdated: Slot<DataViewSelection | undefined> = new Slot();
  setSelection: (selection?: DataViewSelection) => void = selection => {
    this.database.root.selectionManager.set(
      selection
        ? [new DatabaseSelection({ path: this.path, viewSelection: selection })]
        : []
    );
  };
  bindHotkey: (hotkeys: Record<string, UIEventHandler>) => Disposable =
    hotkeys => {
      return {
        dispose: this.database.root.uiEventDispatcher.bindHotkey(hotkeys, {
          path: [],
        }),
      };
    };
  handleEvent: (name: EventName, handler: UIEventHandler) => Disposable = (
    name,
    handler
  ) => {
    return {
      dispose: this.database.root.uiEventDispatcher.add(name, handler, {
        path: [],
      }),
    };
  };

  protected override render(): unknown {
    return html`
      <affine-data-view-native
        .bindHotkey="${this.bindHotkey}"
        .handleEvent="${this.handleEvent}"
        .getFlag="${this.database.getFlag}"
        .selectionUpdated="${this.selectionUpdated}"
        .setSelection="${this.setSelection}"
        .dataSource="${this.database.dataSource}"
        .viewSource="${this.database.viewSource}"
        .headerComponent="${this.database.headerComponent}"
      ></affine-data-view-native>
    `;
  }
}
