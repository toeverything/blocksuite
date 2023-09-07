import type { EventName, UIEventHandler } from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
import type { Disposable } from '@blocksuite/global/utils';
import { Slot } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { PropertyValues } from 'lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { DataViewSelection } from '../../../../../__internal__/index.js';
import { createModal } from '../../../../../components/menu/index.js';
import { renderTemplate } from '../../../../../components/uni-component/uni-component.js';
import { CrossIcon, ExpandWideIcon } from '../../../../../icons/index.js';
import type { DatabaseBlockComponent } from '../../../../database-block.js';
import { DatabaseSelection } from '../../../selection.js';

export function showDatabasePreviewModal(database: DatabaseBlockComponent) {
  const viewComponent = new DatabaseBlockModalPreview();
  viewComponent.database = database;
  const modal = createModal();
  const close = () => {
    modal.remove();
  };
  const container = renderTemplate(() => {
    return html`
      <style>
        .database-block-preview-container {
          position: absolute;
          display: flex;
          padding: 24px 53px;
          border-radius: 8px;
          left: 0;
          right: 0;
          margin: 20px auto auto;
          width: calc(100% - 300px);
          max-height: calc(100% - 40px);
          box-shadow: var(--affine-shadow-1);
          background-color: var(--affine-background-primary-color);
        }
        .database-block-preview-close {
          position: absolute;
          right: 8px;
          top: 8px;
          padding: 2px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
        }
        .database-block-preview-close svg {
          color: var(--affine-icon-color);
          width: 20px;
          height: 20px;
        }
        .database-block-preview-close:hover {
          background-color: var(--affine-hover-color);
        }
      </style>
      <div class="database-block-preview-container">
        <database-block-modal-preview
          .database="${database}"
        ></database-block-modal-preview>
        <div @click="${close}" class="database-block-preview-close">
          ${CrossIcon}
        </div>
      </div>
    `;
  });
  container.onclick = e => {
    e.stopPropagation();
  };
  modal.onclick = close;
  modal.style.backgroundColor = 'var(--affine-black-60)';
  modal.append(container);
}

@customElement('expand-database-block-modal')
export class ExpandDatabaseBlockModal extends WithDisposable(
  ShadowlessElement
) {
  expandDatabase = () => {
    const database = this.closest('affine-database');
    if (database) {
      showDatabasePreviewModal(database);
    }
  };

  protected override render(): unknown {
    if (this.closest('database-block-modal-preview')) {
      return;
    }
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
  static override styles = css`
    database-block-modal-preview {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
    }
  `;
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

  protected override firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    requestAnimationFrame(() => {
      this.querySelector('affine-data-view-native')?.focusFirstCell();
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
