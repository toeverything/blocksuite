import { ShadowlessElement } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import * as icons from './index.js';

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
    return html`${icons[this.name]}`;
  }

  @property({ attribute: false })
  accessor name!: keyof typeof icons;
}
