import { type TemplateResult, html, nothing } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { join } from 'lit/directives/join.js';
import { repeat } from 'lit/directives/repeat.js';

export type Action = {
  icon: TemplateResult<1>;
  name: string;
  type?: string;
  handler?: () => void;
  disabled?: boolean;
};

// Group Actions
export type FatActions = (Action | typeof nothing)[][];

export function renderActions(
  fatActions: FatActions,
  handler?: (action: Action) => Promise<void> | void,
  selectedName?: string
) {
  return join(
    fatActions
      .filter(g => g.length)
      .map(g => g.filter(a => a !== nothing) as Action[])
      .filter(g => g.length)
      .map(actions =>
        repeat(
          actions,
          action => action.name,
          action => html`
            <editor-menu-action
              aria-label=${action.name}
              class=${classMap({
                delete: action.type === 'delete',
              })}
              ?data-selected=${selectedName === action.name}
              ?disabled=${action.disabled}
              @click=${action.handler
                ? action.handler
                : () => handler?.(action)}
            >
              ${action.icon}<span class="label">${action.name}</span>
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
