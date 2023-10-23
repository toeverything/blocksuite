import '../buttons/tool-icon-button.js';

import { WithDisposable } from '@blocksuite/lit';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { UnGroupButtonIcon } from '../../../../_common/icons/index.js';
import { GroupElement } from '../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';

@customElement('edgeless-ungroup-button')
export class EdgelessUnGroupButton extends WithDisposable(LitElement) {
  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  protected override render() {
    return html`<edgeless-tool-icon-button
      .class=${'edgeless-component-toolbar-ungroup-button'}
      .iconContainerPadding=${2}
      @click=${() => {
        const { selectionManager } = this.surface.edgeless;
        if (selectionManager.firstElement instanceof GroupElement) {
          this.surface.group.unGroup(selectionManager.firstElement);
        }
      }}
      .tooltip=${'UnGroup'}
      .tipPosition=${'bottom'}
    >
      ${UnGroupButtonIcon}
    </edgeless-tool-icon-button> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-ungroup-button': EdgelessUnGroupButton;
  }
}
