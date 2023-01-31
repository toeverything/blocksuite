import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { TagSchema } from '@blocksuite/global/database';
import { listTagSchemaRenderer } from '@blocksuite/global/database';

export const DatabaseBlockSettingsSidebarTag =
  'affine-database-settings-sidebar' as const;
@customElement(DatabaseBlockSettingsSidebarTag)
export class DatabaseBlockSettingsSidebar extends LitElement {
  static styles = css`
    :host {
      position: absolute;
      right: 0;
      top: 0;
      display: flex;
      flex-direction: column;
      height: 100%;
      border-left: 1px solid rgb(233, 233, 231);
      background-color: var(--affine-page-background);
    }

    :host > * {
      padding-left: 14px;
    }

    .affine-database-settings-sidebar-subtitle {
      color: rgba(55, 53, 47, 0.65);
      padding-top: 14px;
      padding-bottom: 14px;
      font-size: 12px;
      font-weight: 500;
      line-height: 120%;
      user-select: none;
    }

    .affine-database-settings-sidebar-title {
      padding-top: 12px;
      font-size: 14px;
      font-weight: 600;
    }

    .affine-database-settings-sidebar-list {
      font-size: 14px;
    }

    .affine-database-settings-sidebar-list > div {
      min-height: 28px;
    }
  `;

  @property()
  show = false;

  @property()
  onSelectType!: (type: TagSchema['type']) => void;

  private _handleSelectType = (e: MouseEvent) => {
    if (e.target instanceof HTMLElement) {
      const type = e.target.getAttribute('data-type');
      this.onSelectType(type as TagSchema['type']);
    }
  };

  private _handleClose = () => {
    this.show = false;
  };

  private _handleClickAway = (event: MouseEvent) => {
    if (this.contains(event.target as Node)) {
      return;
    }
    this._handleClose();
  };

  protected update(changedProperties: Map<string, unknown>) {
    super.update(changedProperties);
    if (changedProperties.has('show')) {
      if (this.show) {
        this.style.minWidth = `290px`;
        this.style.maxWidth = `290px`;
        setTimeout(() =>
          document.addEventListener('click', this._handleClickAway)
        );
      } else {
        this.style.minWidth = '0';
        this.style.maxWidth = `0`;
        document.removeEventListener('click', this._handleClickAway);
      }
    }
  }

  protected render() {
    if (!this.show) {
      return null;
    }
    return html`
      <div class="affine-database-settings-sidebar-title">
        New column
        <button @click=${this._handleClose}>X</button>
      </div>
      <div class="affine-database-settings-sidebar-subtitle">Type</div>
      <div class="affine-database-settings-sidebar-list">
        ${repeat(
          listTagSchemaRenderer(),
          renderer => renderer.type,
          renderer =>
            html`
              <div
                data-type="${renderer.type}"
                @click=${this._handleSelectType}
              >
                ${renderer.displayName}
              </div>
            `
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [DatabaseBlockSettingsSidebarTag]: DatabaseBlockSettingsSidebar;
  }
}
