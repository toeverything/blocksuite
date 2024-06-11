import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { LinkIcon } from '../../../../../_common/icons/text.js';
import { getTooltipWithShortcut } from '../../utils.js';
import { QuickToolMixin } from '../mixins/quick-tool.mixin.js';

@customElement('edgeless-link-tool-button')
export class EdgelessLinkToolButton extends QuickToolMixin(LitElement) {
  override type = 'default' as const;
  static override styles = css`
    .link-icon,
    .link-icon > svg {
      width: 24px;
      height: 24px;
    }
  `;

  private _onClick() {
    this.edgeless.service.std.command.exec('insertLinkByQuickSearch');
  }

  override render() {
    return html`<edgeless-tool-icon-button
      .iconContainerPadding="${6}"
      .tooltip="${getTooltipWithShortcut('Link', '@')}"
      .tooltipOffset=${17}
      class="edgeless-link-tool-button"
      @click=${this._onClick}
    >
      <span class="link-icon">${LinkIcon}</span>
    </edgeless-tool-icon-button>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-link-tool-button': EdgelessLinkToolButton;
  }
}
