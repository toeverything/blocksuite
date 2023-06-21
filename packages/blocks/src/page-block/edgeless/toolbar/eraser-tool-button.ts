import '../components/tool-icon-button.js';

import { EdgelessEraserIcon } from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { type MouseMode } from '../../../__internal__/index.js';
import { getTooltipWithShortcut } from '../components/utils.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';

@customElement('edgeless-eraser-tool-button')
export class EdgelessEraserToolButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
    }

    edgeless-tool-icon-button svg:hover {
      transform: translateY(-8px);
    }
  `;

  @property({ attribute: false })
  mouseMode!: MouseMode;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
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
        .tooltip=${getTooltipWithShortcut('Eraser', 'E')}
        .active=${type === 'eraser'}
        @click=${() => this.setMouseMode({ type: 'eraser' })}
      >
        ${EdgelessEraserIcon}
      </edgeless-tool-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-eraser-tool-button': EdgelessEraserToolButton;
  }
}
