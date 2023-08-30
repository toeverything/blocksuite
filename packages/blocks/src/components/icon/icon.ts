import { ShadowlessElement } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import * as icons from '../../icons/index.js';

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
  @property({ attribute: false })
  name!: keyof typeof icons;

  protected override render(): unknown {
    return html`${icons[this.name]}`;
  }
}
