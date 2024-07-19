import type { EventName, UIEventHandler } from '@blocksuite/block-std';
import type { Disposable } from '@blocksuite/global/utils';
import type { PropertyValues } from 'lit';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { Slot, assertExists } from '@blocksuite/global/utils';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { DataViewRendererConfig } from '../../data-view/data-view.js';
import type { DataViewSelection } from '../../data-view/types.js';
import type { DatabaseBlockComponent } from '../../database-block.js';

import { createModal } from '../../../_common/components/index.js';
import { CrossIcon, ExpandWideIcon } from '../../../_common/icons/index.js';
import { DatabaseSelection } from '../../data-view/common/selection.js';
import { renderTemplate } from '../../data-view/utils/uni-component/render-template.js';
import { WidgetBase } from '../../data-view/widget/widget-base.js';

export function showDatabasePreviewModal(database: DatabaseBlockComponent) {
  const viewComponent = new DatabaseBlockModalPreview();
  viewComponent.database = database;
  const editorHost = document.querySelector('editor-host');
  assertExists(editorHost);
  const modal = createModal(editorHost);
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
          right: -48px;
          top: 0;
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          background-color: var(--affine-background-primary-color);
        }
        .database-block-preview-close svg {
          color: var(--affine-icon-color);
          width: 16px;
          height: 16px;
        }
        .database-block-preview-close:hover {
          background-color: var(--affine-hover-color-filled);
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
export class ExpandDatabaseBlockModal extends WidgetBase {
  expandDatabase = () => {
    const database = this.closest('affine-database');
    if (database) {
      showDatabasePreviewModal(database);
    }
  };

  protected override render(): unknown {
    if (
      this.closest('database-block-modal-preview') ||
      !this.database?.doc.awarenessStore.getFlag('enable_expand_database_block')
    ) {
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

  get database() {
    return this.closest('affine-database');
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

  bindHotkey: (hotkeys: Record<string, UIEventHandler>) => Disposable =
    hotkeys => {
      return {
        dispose: this.database.host.event.bindHotkey(hotkeys, {
          path: [],
        }),
      };
    };

  blockId = 'database-modal-preview';

  handleEvent: (name: EventName, handler: UIEventHandler) => Disposable = (
    name,
    handler
  ) => {
    return {
      dispose: this.database.host.event.add(name, handler, {
        path: [],
      }),
    };
  };

  selectionUpdated = new Slot<DataViewSelection | undefined>();

  setSelection: (selection?: DataViewSelection) => void = selection => {
    this.database.host.selection.set(
      selection
        ? [
            new DatabaseSelection({
              blockId: this.blockId,
              viewSelection: selection,
            }),
          ]
        : []
    );
  };

  override connectedCallback() {
    super.connectedCallback();
    this.database.selection.slots.changed.on(selections => {
      const selection = selections.find(v => {
        return v.blockId === this.blockId;
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
      this.querySelector('affine-data-view-renderer')?.focusFirstCell();
    });
  }

  protected override render(): unknown {
    const config: DataViewRendererConfig = {
      bindHotkey: this.bindHotkey,
      handleEvent: this.handleEvent,
      getFlag: this.database.getFlag,
      selectionUpdated: this.selectionUpdated,
      setSelection: this.setSelection,
      dataSource: this.database.dataSource,
      viewSource: this.database.viewSource,
      headerWidget: this.database.headerWidget,
      std: this.database.std,
    };
    return html`
      <affine-data-view-renderer
        .config="${config}"
      ></affine-data-view-renderer>
    `;
  }

  @property({ attribute: false })
  accessor database!: DatabaseBlockComponent;
}
