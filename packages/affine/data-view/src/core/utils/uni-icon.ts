import { ShadowlessElement } from '@blocksuite/block-std';
import * as icons from '@blocksuite/icons/lit';
import { css, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { uniMap } from './uni-component/operation.js';
import { createUniComponentFromWebComponent } from './uni-component/uni-component.js';

@customElement('affine-lit-icon')
export class AffineLitIcon extends ShadowlessElement {
  static override styles = css`
    affine-lit-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    affine-lit-icon svg {
      fill: var(--affine-icon-color);
    }
  `;

  protected override render(): unknown {
    const createIcon = icons[this.name] as () => TemplateResult;
    return html`${createIcon?.()}`;
  }

  @property({ attribute: false })
  accessor name!: keyof typeof icons;
}

const litIcon = createUniComponentFromWebComponent<{ name: string }>(
  AffineLitIcon
);
export const createIcon = (name: keyof typeof icons) => {
  return uniMap(litIcon, () => ({ name }));
};
