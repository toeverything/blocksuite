import '../buttons/tool-icon-button.js';

import { WithDisposable } from '@blocksuite/lit';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { FrameIcon } from '../../../../_common/icons/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';

@customElement('edgeless-add-frame-button')
export class EdgelessAddFrameButton extends WithDisposable(LitElement) {
  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  protected override render() {
    return html`<edgeless-tool-icon-button
      .iconContainerPadding=${2}
      @click=${() => {
        this.edgeless.surface.frame.createFrameOnSelected();
      }}
    >
      ${FrameIcon}<span
        style=${styleMap({
          fontSize: '12px',
          fontWeight: 400,
          color: 'var(--affine-icon-color)',
          marginLeft: '4px',
        })}
        >Frame</span
      >
    </edgeless-tool-icon-button>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-add-frame-button': EdgelessAddFrameButton;
  }
}
