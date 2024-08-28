import { renderGroups } from '@blocksuite/affine-components/toolbar';
import { WithDisposable } from '@blocksuite/block-std';
import { MoreHorizontalIcon, MoreVerticalIcon } from '@blocksuite/icons/lit';
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessRootBlockComponent } from '../../../edgeless/edgeless-root-block.js';

import {
  clipboardGroup,
  conversionsGroup,
  deleteGroup,
  openGroup,
  reorderGroup,
  sectionGroup,
} from './config.js';
import { ElementToolbarMoreMenuContext } from './context.js';

const BUILT_IN_GROUPS = [
  sectionGroup,
  reorderGroup,
  openGroup,
  clipboardGroup,
  conversionsGroup,
  deleteGroup,
];

@customElement('edgeless-more-button')
export class EdgelessMoreButton extends WithDisposable(LitElement) {
  override render() {
    const context = new ElementToolbarMoreMenuContext(this.edgeless);
    const groups = context.config.configure(
      BUILT_IN_GROUPS.map(group => ({ ...group, items: [...group.items] }))
    );
    const actions = renderGroups(groups, context);

    return html`
      <editor-menu-button
        .contentPadding=${'8px'}
        .button=${html`
          <editor-icon-button aria-label="More" .tooltip=${'More'}>
            ${this.vertical
              ? MoreVerticalIcon({ width: '20', height: '20' })
              : MoreHorizontalIcon({ width: '20', height: '20' })}
          </editor-icon-button>
        `}
      >
        <div
          class="more-actions-container"
          data-size="large"
          data-orientation="vertical"
        >
          ${actions}
        </div>
      </editor-menu-button>
    `;
  }

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor elements: BlockSuite.EdgelessModel[] = [];

  @property({ attribute: false })
  accessor vertical = false;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-more-button': EdgelessMoreButton;
  }
}
