import { WithDisposable } from '@blocksuite/block-std';
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

import '../../../_common/components/toolbar/icon-button.js';
import { ReleaseFromGroupButtonIcon } from '../../../_common/icons/index.js';
import { GroupElementModel } from '../../../surface-block/element-model/group.js';

@customElement('edgeless-release-from-group-button')
export class EdgelessReleaseFromGroupButton extends WithDisposable(LitElement) {
  private _releaseFromGroup() {
    const service = this.edgeless.service;
    const element = service.selection.firstElement;

    if (!(element.group instanceof GroupElementModel)) return;

    const group = element.group;

    // eslint-disable-next-line unicorn/prefer-dom-node-remove
    group.removeChild(element);

    element.index = service.layer.generateIndex(
      'flavour' in element ? element.flavour : element.type
    );

    const parent = group.group;
    if (parent instanceof GroupElementModel) {
      parent.addChild(element.id);
    }
  }

  protected override render() {
    return html`
      <editor-icon-button
        aria-label="Release from group"
        .tooltip=${'Release from group'}
        .iconSize=${'20px'}
        @click=${() => this._releaseFromGroup()}
      >
        ${ReleaseFromGroupButtonIcon}
      </editor-icon-button>
    `;
  }

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-release-from-group-button': EdgelessReleaseFromGroupButton;
  }
}

export function renderReleaseFromGroupButton(
  edgeless: EdgelessRootBlockComponent
) {
  return html`
    <edgeless-release-from-group-button
      .edgeless=${edgeless}
    ></edgeless-release-from-group-button>
  `;
}
