import { type TemplateResult, html, nothing } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { join } from 'lit/directives/join.js';
import { repeat } from 'lit/directives/repeat.js';

export type MenuItem = {
  icon: TemplateResult<1>;
  label: string;
  type?: string;
  action?: () => void;
  disabled?: boolean;
};

export type MenuItemGroup = {
  type: string;
  items: MenuItem[];
};

// Group Actions
export type FatMenuItems = (MenuItem | typeof nothing)[][];

export function renderActions(
  fatMenuItems: FatMenuItems,
  action?: (item: MenuItem) => Promise<void> | void,
  selectedName?: string
) {
  return join(
    fatMenuItems
      .filter(g => g.length)
      .map(g => g.filter(a => a !== nothing) as MenuItem[])
      .filter(g => g.length)
      .map(items =>
        repeat(
          items,
          item => item.label,
          item => html`
            <editor-menu-action
              aria-label=${item.label}
              class=${classMap({
                delete: item.type === 'delete',
              })}
              ?data-selected=${selectedName === item.label}
              ?disabled=${item.disabled}
              @click=${item.action ? item.action : () => action?.(item)}
            >
              ${item.icon}<span class="label">${item.label}</span>
            </editor-menu-action>
          `
        )
      ),
    () => html`
      <editor-toolbar-separator
        data-orientation="horizontal"
      ></editor-toolbar-separator>
    `
  );
}

export function renderToolbarSeparator() {
  return html`<editor-toolbar-separator></editor-toolbar-separator>`;
}
