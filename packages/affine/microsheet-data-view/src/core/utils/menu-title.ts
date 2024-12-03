import { ArrowLeftBigIcon } from '@blocksuite/icons/lit';
import { html } from 'lit';

export const menuTitle = (name: string, onBack: () => void) => {
  return html`
    <div
      style="display:flex;align-items:center;gap: 4px;padding: 3px 3px 3px 2px"
    >
      <div
        @click=${onBack}
        class="dv-icon-20 dv-hover dv-pd-2 dv-round-4"
        style="display:flex;"
      >
        ${ArrowLeftBigIcon()}
      </div>
      <div
        style="font-weight:500;font-size: 14px;line-height: 22px;color: var(--affine-text-primary-color)"
      >
        ${name}
      </div>
    </div>
  `;
};
