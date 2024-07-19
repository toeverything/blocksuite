import { WithDisposable } from '@blocksuite/block-std';
import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

import '../../../_common/components/toolbar/icon-button.js';
import { GroupIcon } from '../../../_common/icons/index.js';
import {
  GroupElementModel,
  MindmapElementModel,
} from '../../../surface-block/index.js';

@customElement('edgeless-add-group-button')
export class EdgelessAddGroupButton extends WithDisposable(LitElement) {
  private _createGroup = () => {
    this.edgeless.service.createGroupFromSelected();
  };

  static override styles = css`
    .label {
      padding-left: 4px;
    }
  `;

  protected override render() {
    return html`
      <editor-icon-button
        aria-label="Group"
        .tooltip=${'Group'}
        .labelHeight=${'20px'}
        @click=${this._createGroup}
      >
        ${GroupIcon}<span class="label medium">Group</span>
      </editor-icon-button>
    `;
  }

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-add-group-button': EdgelessAddGroupButton;
  }
}

export function renderAddGroupButton(
  edgeless: EdgelessRootBlockComponent,
  elements: BlockSuite.EdgelessModelType[]
) {
  if (elements.length < 2) return nothing;
  if (elements[0] instanceof GroupElementModel) return nothing;
  if (elements.some(e => e.group instanceof MindmapElementModel))
    return nothing;

  return html`
    <edgeless-add-group-button
      .edgeless=${edgeless}
    ></edgeless-add-group-button>
  `;
}
