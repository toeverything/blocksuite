import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { toRadian } from '../../../../surface-block/index.js';
import { getPosition } from '../utils.js';

const styles = css`
  .rotator {
    position: absolute;
    background: var(--affine-background-overlay-panel-color);
    box-shadow: var(--affine-shadow-2);
    border: 2px solid var(--affine-primary-color);
    border-radius: 50%;
    width: 7px;
    height: 7px;
    top: 50%;
    left: 50%;
  }
`;

@customElement('pie-center-rotator')
export class PieCenterRotator extends LitElement {
  static override styles = styles;

  @property({ attribute: false })
  accessor isActive!: boolean;

  @property({ attribute: false })
  accessor angle: number | null = null;

  protected override render() {
    if (!this.isActive || this.angle === null) return nothing;

    const [x, y] = getPosition(toRadian(this.angle), [45, 45]);

    const styles = {
      transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
    };

    return html`<span style="${styleMap(styles)}" class="rotator"></span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pie-center-rotator': PieCenterRotator;
  }
}
