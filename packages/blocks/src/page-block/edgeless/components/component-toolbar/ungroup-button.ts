import '../buttons/tool-icon-button.js';

import { WithDisposable } from '@blocksuite/lit';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { UngroupButtonIcon } from '../../../../_common/icons/index.js';
import { GroupElement } from '../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';

@customElement('edgeless-ungroup-button')
export class EdgelessUngroupButton extends WithDisposable(LitElement) {
  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  protected override render() {
    return html`<edgeless-tool-icon-button
      .class=${'edgeless-component-toolbar-ungroup-button'}
      .iconContainerPadding=${2}
      @click=${() => {
        const { selectionManager } = this.surface.edgeless;
        if (selectionManager.firstElement instanceof GroupElement) {
          this.surface.group.ungroup(selectionManager.firstElement);
        }
      }}
      .tooltip=${'Ungroup'}
      .tipPosition=${'bottom'}
    >
      ${UngroupButtonIcon}
    </edgeless-tool-icon-button> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-ungroup-button': EdgelessUngroupButton;
  }
}
