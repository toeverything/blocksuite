import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { createDatabasePopup } from './popup.js';

export type Action = {
  type: 'action';
  label: string;
  click: () => false | void;
};
export type Menu = Action;
export type MenuGroup = Menu[];

@customElement('database-menu-component')
export class DatabaseMenuComponent extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    database-menu-component {
      display: flex;
      flex-direction: column;
      user-select: none;
      box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      background-color: white;
      padding: 4px 0;
      position: absolute;
      z-index: 999;
    }

    .database-menu-component-action-wrapper {
      padding: 0 4px;
    }

    .database-menu-component-action-button {
      padding: 2px 4px;
      border-radius: 4px;
      cursor: pointer;
      white-space: nowrap;
    }

    .database-menu-component-action-button:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }
  `;
  @property()
  menuGroup!: MenuGroup;

  override render() {
    const group = this.menuGroup;

    return html`
      <div class="database-menu-component">
        ${repeat(group, menu => {
          const click = () => {
            if (menu.click() !== false) {
              this.remove();
            }
          };
          return html` <div class="database-menu-component-action-wrapper">
            <div
              class="database-menu-component-action-button"
              @click="${click}"
            >
              ${menu.label}
            </div>
          </div>`;
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'database-menu-component': DatabaseMenuComponent;
  }
}
export const popMenu = (
  target: HTMLElement,
  props: {
    options: MenuGroup;
  }
) => {
  const menu = new DatabaseMenuComponent();
  menu.menuGroup = props.options;
  createDatabasePopup(target, menu);
};
