import '../buttons/tool-icon-button.js';

import { WithDisposable } from '@blocksuite/block-std';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { ReleaseFromGroupButtonIcon } from '../../../../_common/icons/index.js';
import { GroupElementModel } from '../../../../surface-block/element-model/group.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';

@customElement('edgeless-release-from-group-button')
export class EdgelessReleaseFromGroupButton extends WithDisposable(LitElement) {
  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  private _releaseFromGroup() {
    const service = this.surface.edgeless.service;
    const element = service.selection.firstElement;

    if (!(element.group instanceof GroupElementModel)) return;

    const group = element.group;

    group.removeDescendant(element.id);

    element.index = service.layer.generateIndex(
      'flavour' in element ? element.flavour : element.type
    );

    const parent = group.group;
    if (parent instanceof GroupElementModel) {
      parent.addChild(element.id);
    }
  }

  protected override render() {
    return html`<edgeless-tool-icon-button
      .iconContainerPadding=${2}
      @click=${() => {
        this._releaseFromGroup();
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
