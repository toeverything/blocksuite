import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { LinkIcon } from '../../../../../_common/icons/text.js';
import { getTooltipWithShortcut } from '../../utils.js';
import { QuickToolMixin } from '../mixins/quick-tool.mixin.js';

@customElement('edgeless-link-tool-button')
export class EdgelessLinkToolButton extends QuickToolMixin(LitElement) {
  static override styles = css`
    .link-icon,
    .link-icon > svg {
      width: 24px;
      height: 24px;
    }
  `;

  override type = 'default' as const;

  private _onClick() {
    this.edgeless.service
      .insertLinkByQuickSearch()
      .then(type => {
        if (type) {
          this.edgeless.service.telemetryService?.track('CanvasElementAdded', {
            control: 'toolbar:general',
            page: 'whiteboard editor',
            module: 'toolbar',
            segment: 'toolbar',
            type: type.flavour.split(':')[1],
          });

          if (type.isNewDoc) {
            this.edgeless.service.telemetryService?.track('DocCreated', {
              control: 'toolbar:general',
              page: 'whiteboard editor',
              module: 'edgeless toolbar',
              segment: 'whiteboard',
              type: type.flavour.split(':')[1],
            });
            this.edgeless.service.telemetryService?.track('LinkedDocCreated', {
              control: 'links',
              page: 'whiteboard editor',
              module: 'edgeless toolbar',
              segment: 'whiteboard',
              type: type.flavour.split(':')[1],
              other: 'new doc',
            });
          } else {
            this.edgeless.service.telemetryService?.track('LinkedDocCreated', {
              control: 'links',
              page: 'whiteboard editor',
              module: 'edgeless toolbar',
              segment: 'whiteboard',
              type: type.flavour.split(':')[1],
              other: 'existing doc',
            });
          }
        }
      })
      .catch(console.error);
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
