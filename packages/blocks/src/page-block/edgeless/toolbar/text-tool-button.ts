import '../components/tool-icon-button.js';

import { NewTextIcon } from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { type MouseMode } from '../../../__internal__/index.js';
import { getTooltipWithShortcut } from '../components/utils.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';

@customElement('edgeless-text-tool-button')
export class EdgelessTextToolButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
    }

    edgeless-tool-icon-button svg:hover {
      transform: translateY(-8px);
    }
  `;

  @property()
  mouseMode!: MouseMode;

  @property()
  edgeless!: EdgelessPageBlockComponent;

  @property()
  setMouseMode!: (mouseMode: MouseMode) => void;

  constructor(edgeless: EdgelessPageBlockComponent) {
    super();
    this.edgeless = edgeless;
  }

  private iconButtonStyles = `
        --hover-color: transparent;
        --active-color: var(--affine-primary-color);
    `;

  override render() {
    const type = this.mouseMode?.type;

    return html`
      <edgeless-tool-icon-button
        style=${this.iconButtonStyles}
        .tooltip=${getTooltipWithShortcut('Text', 'T')}
        .active=${type === 'text'}
        @click=${() => this.setMouseMode({ type: 'text' })}
      >
        ${NewTextIcon}
      </edgeless-tool-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-text-tool-button': EdgelessTextToolButton;
  }
}
