import './icon-button.js';
import './menu-button.js';
import './separator.js';

import { html, nothing, type TemplateResult } from 'lit';
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
            <affine-menu-action
              aria-label=${action.name}
              ?data-selected=${selectedName === action.name}
              ?disabled=${action.disabled}
              @click=${action.handler
                ? action.handler
                : () => handler?.(action)}
            >
              ${action.icon}<span class="label">${action.name}</span>
            </affine-menu-action>
          `
        )
      ),
    () => html`
      <affine-separator
        data-orientation="horizontal"
        style="--height: 8px"
      ></affine-separator>
    `
  );
}
