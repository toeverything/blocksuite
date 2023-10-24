import '../buttons/tool-icon-button.js';
import './component-toolbar-menu-divider.js';

import { WithDisposable } from '@blocksuite/lit';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  RenameIcon,
  UngroupButtonIcon,
} from '../../../../_common/icons/index.js';
import type { GroupElement } from '../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';
import { mountGroupTitleEditor } from '../../utils/text.js';

@customElement('edgeless-change-group-button')
export class EdgelessChangeGroupButton extends WithDisposable(LitElement) {
  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  @property({ attribute: false })
  groups!: GroupElement[];

  protected override render() {
    const { groups } = this;
    return html`
      ${groups.length === 1
        ? html` <edgeless-tool-icon-button
              class=${'edgeless-component-toolbar-group-rename-button'}
              @click=${() =>
                mountGroupTitleEditor(groups[0], this.surface.edgeless)}
              .tooltip=${'Rename'}
              .tipPosition=${'bottom'}
            >
              ${RenameIcon}
            </edgeless-tool-icon-button>

            <component-toolbar-menu-divider
              style=${'margin: 0 8px'}
              .vertical=${true}
            ></component-toolbar-menu-divider>`
        : nothing}
      <edgeless-tool-icon-button
        class=${'edgeless-component-toolbar-ungroup-button'}
        @click=${() => {
          groups.forEach(group => this.surface.group.unGroup(group));
        }}
        .tooltip=${'Ungroup'}
        .tipPosition=${'bottom'}
      >
        ${UngroupButtonIcon}
      </edgeless-tool-icon-button>
    `;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.style.display = 'flex';
    this.style.alignItems = 'center';
    this.style.justifyContent = 'center';
  }

  protected override createRenderRoot() {
    return this;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-group-button': EdgelessChangeGroupButton;
  }
}
