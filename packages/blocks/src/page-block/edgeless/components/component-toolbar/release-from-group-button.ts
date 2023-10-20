import '../buttons/tool-icon-button.js';

import { WithDisposable } from '@blocksuite/lit';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { ReleaseFromGroupButtonIcon } from '../../../../icons/index.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';

@customElement('edgeless-release-from-group-button')
export class EdgelessReleaseFromGroupButton extends WithDisposable(LitElement) {
  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  protected override render() {
    return html`<edgeless-tool-icon-button
      .iconContainerPadding=${2}
      @click=${() => {
        this.surface.group.releaseFromGroup(
          this.surface.edgeless.selectionManager.firstElement
        );
      }}
      .tooltip=${'Release From Group'}
      .tipPosition=${'bottom'}
    >
      ${ReleaseFromGroupButtonIcon}
    </edgeless-tool-icon-button> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-release-from-group-button': EdgelessReleaseFromGroupButton;
  }
}
