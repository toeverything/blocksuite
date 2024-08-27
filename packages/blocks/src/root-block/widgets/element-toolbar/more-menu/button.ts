import { renderActions } from '@blocksuite/affine-components/toolbar';
import { WithDisposable } from '@blocksuite/block-std';
import { MoreHorizontalIcon, MoreVerticalIcon } from '@blocksuite/icons/lit';
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessRootBlockComponent } from '../../../edgeless/edgeless-root-block.js';
import type { EdgelessElementToolbarWidgetConfig } from '../config.js';
import type { MoreMenuItemGroup } from './config.js';

import {
  clipboardGroup,
  conversionsGroup,
  deleteGroup,
  openGroup,
  reorderGroup,
  sectionGroup,
} from './config.js';
import { MoreMenuContext } from './context.js';

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
    const context = new MoreMenuContext(this.edgeless);
    const groups = this.config.configureMoreMenu(
      BUILT_IN_GROUPS.map(group => ({ ...group, items: [...group.items] }))
    );

    const actions = renderActions(
      groups
        .filter(group => group.showWhile?.(context) ?? true)
        .map(({ items }) =>
          items
            .filter(item => item.showWhile?.(context) ?? true)
            .map(({ icon, label, type, action, disabled, generate }) => {
              if (action && typeof action === 'function') {
                return {
                  icon,
                  label,
                  type,
                  action: () => {
                    action(context)?.catch(console.error);
                  },
                  disabled:
                    typeof disabled === 'function'
                      ? disabled(context)
                      : disabled,
                };
              }

              if (generate && typeof generate === 'function') {
                const result = generate(context);

                if (!result) return;

                return {
                  icon,
                  label,
                  type,
                  ...result,
                };
              }

              return;
            })
            .filter(item => !!item)
        )
    );

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

  get config(): EdgelessElementToolbarWidgetConfig {
    return {
      configureMoreMenu: (groups: MoreMenuItemGroup[]) => groups,
      ...this.edgeless.std.spec.getConfig('affine:page')
        ?.edgelessElementToolbarWidget,
    };
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
