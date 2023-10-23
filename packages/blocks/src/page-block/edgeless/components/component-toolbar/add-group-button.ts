import '../buttons/tool-icon-button.js';

import { WithDisposable } from '@blocksuite/lit';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { AddGroupButtonIcon } from '../../../../_common/icons/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';

@customElement('edgeless-add-group-button')
export class EdgelessAddGroupButton extends WithDisposable(LitElement) {
  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  protected override render() {
    return html`<edgeless-tool-icon-button
      .iconContainerPadding=${2}
      @click=${() => {
        this.edgeless.surface.group.createGroupOnSelected();
      }}
    >
      ${AddGroupButtonIcon}
    </edgeless-tool-icon-button>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-add-group-button': EdgelessAddGroupButton;
  }
}
