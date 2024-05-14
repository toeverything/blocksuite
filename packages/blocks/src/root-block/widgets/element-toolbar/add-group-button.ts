import '../../edgeless/components/buttons/tool-icon-button.js';

import { WithDisposable } from '@blocksuite/block-std';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { GroupIcon } from '../../../_common/icons/index.js';
import { MindmapElementModel } from '../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import type { EdgelessModel } from '../../edgeless/type.js';

@customElement('edgeless-add-group-button')
export class EdgelessAddGroupButton extends WithDisposable(LitElement) {
  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  protected override render() {
    return html` <edgeless-tool-icon-button
      .iconContainerPadding=${2}
      @click=${() => {
        this.edgeless.service.createGroupFromSelected();
      }}
      .tooltip=${'Group'}
    >
      ${GroupIcon}<span
        style=${styleMap({
          fontSize: '12px',
          fontWeight: 400,
          color: 'var(--affine-icon-color)',
          marginLeft: '4px',
        })}
        >Group</span
      >
    </edgeless-tool-icon-button>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-add-group-button': EdgelessAddGroupButton;
  }
}

export function renderAddGroupButton(
  edgeless: EdgelessRootBlockComponent,
  elements: EdgelessModel[]
) {
  if (elements.length < 2) return nothing;
  if (elements.some(e => e.group instanceof MindmapElementModel))
    return nothing;

  return html`<edgeless-add-group-button
    .edgeless=${edgeless}
  ></edgeless-add-group-button>`;
}
