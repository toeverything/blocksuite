import { GroupIcon } from '@blocksuite/affine-components/icons';
import {
  GroupElementModel,
  MindmapElementModel,
} from '@blocksuite/affine-model';
import { WithDisposable } from '@blocksuite/global/utils';
import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

export class EdgelessAddGroupButton extends WithDisposable(LitElement) {
  static override styles = css`
    .label {
      padding-left: 4px;
    }
  `;

  private _createGroup = () => {
    this.edgeless.service.createGroupFromSelected();
  };

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
  elements: BlockSuite.EdgelessModel[]
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
