import { LinkIcon } from '@blocksuite/affine-components/icons';
import { TelemetryProvider } from '@blocksuite/affine-shared/services';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

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
    const { insertedLinkType } = this.edgeless.std.command.exec(
      'insertLinkByQuickSearch'
    );
    insertedLinkType
      ?.then(type => {
        if (!type) return;

        this.edgeless.std
          .getOptional(TelemetryProvider)
          ?.track('CanvasElementAdded', {
            control: 'toolbar:general',
            page: 'whiteboard editor',
            module: 'toolbar',
            segment: 'toolbar',
            type: type.flavour?.split(':')[1],
          });

        if (type.isNewDoc) {
          this.edgeless.std
            .getOptional(TelemetryProvider)
            ?.track('DocCreated', {
              control: 'toolbar:general',
              page: 'whiteboard editor',
              module: 'edgeless toolbar',
              segment: 'whiteboard',
              type: type.flavour?.split(':')[1],
            });
          this.edgeless.std
            .getOptional(TelemetryProvider)
            ?.track('LinkedDocCreated', {
              control: 'links',
              page: 'whiteboard editor',
              module: 'edgeless toolbar',
              segment: 'whiteboard',
              type: type.flavour?.split(':')[1],
              other: 'new doc',
            });
        } else {
          this.edgeless.std
            .getOptional(TelemetryProvider)
            ?.track('LinkedDocCreated', {
              control: 'links',
              page: 'whiteboard editor',
              module: 'edgeless toolbar',
              segment: 'whiteboard',
              type: type.flavour?.split(':')[1],
              other: 'existing doc',
            });
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
