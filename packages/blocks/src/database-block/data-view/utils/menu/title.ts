import type { TemplateResult } from 'lit';
import { html } from 'lit';

import { ArrowLeftBigIcon } from '../../common/icons/index.js';
import type { Menu } from './menu.js';

export const menuTitleItem = (
  name: string,
  onBack: () => void,
  ops?: {
    right?: TemplateResult;
  }
): Menu => {
  return {
    type: 'custom',
    render: html`<div
      style="display:flex;align-items:center;gap: 8px;padding: 7px 12px;min-width: 300px;justify-content: space-between"
    >
      ${menuTitle(name, onBack)}
      <div>${ops?.right}</div>
    </div>`,
  };
};
export const menuTitle = (name: string, onBack: () => void) => {
  return html`
    <div style="display:flex;align-items:center;gap: 8px;">
      <div
        @click=${onBack}
        class="dv-icon-20 dv-hover dv-pd-2 dv-round-4"
        style="display:flex;"
      >
        ${ArrowLeftBigIcon}
      </div>
      <div
        style="font-size: 12px;line-height: 20px;color: var(--affine-text-secondary-color)"
      >
        ${name}
      </div>
    </div>
  `;
};
