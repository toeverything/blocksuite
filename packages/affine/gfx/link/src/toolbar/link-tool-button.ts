import { insertLinkByQuickSearchCommand } from '@labre/affine-block-bookmark';
import { insertEmbedCard } from '@labre/affine-block-embed';
import { DefaultTool } from '@labre/affine-block-surface';
import { toggleEmbedCardCreateModal } from '@labre/affine-components/embed-card-modal';
import { LinkIcon } from '@labre/affine-components/icons';
import { TelemetryProvider } from '@labre/affine-shared/services';
import { QuickToolMixin } from '@labre/affine-widget-edgeless-toolbar';
import { GfxControllerIdentifier } from '@labre/std/gfx';
import { css, html, LitElement } from 'lit';

export class EdgelessLinkToolButton extends QuickToolMixin(LitElement) {
  static override styles = css`
    .link-icon,
    .link-icon > svg {
      width: 24px;
      height: 24px;
    }
  `;

  override type = DefaultTool;

  private _onClick() {
    const [success, { insertedLinkType }] = this.edgeless.std.command.exec(
      insertLinkByQuickSearchCommand
    );

    if (!success) {
      // fallback to create a bookmark block with input modal
      toggleEmbedCardCreateModal(
        this.edgeless.host,
        'Links',
        'The added link will be displayed as a card view.',
        {
          mode: 'edgeless',
          onSave: url => {
            insertEmbedCard(this.edgeless.std, {
              flavour: 'affine:bookmark',
              targetStyle: 'vertical',
              props: { url },
            });
          },
        },
        ({ mode }) => {
          if (mode === 'edgeless') {
            const gfx = this.edgeless.std.get(GfxControllerIdentifier);
            gfx.tool.setTool(DefaultTool);
          }
        }
      ).catch(console.error);
      return;
    }

    insertedLinkType
      ?.then(type => {
        const flavour = type?.flavour;
        if (!flavour) return;

        this.edgeless.std
          .getOptional(TelemetryProvider)
          ?.track('CanvasElementAdded', {
            control: 'toolbar:general',
            page: 'whiteboard editor',
            module: 'toolbar',
            segment: 'toolbar',
            type: flavour.split(':')[1],
          });

        this.edgeless.std
          .getOptional(TelemetryProvider)
          ?.track('LinkedDocCreated', {
            control: 'links',
            page: 'whiteboard editor',
            module: 'edgeless toolbar',
            segment: 'whiteboard',
            type: flavour.split(':')[1],
            other: 'existing doc',
          });
      })
      .catch(console.error);
  }

  override render() {
    return html`<edgeless-tool-icon-button
      .iconContainerPadding="${6}"
      .tooltip="${html`<affine-tooltip-content-with-shortcut
        data-tip="${'Link'}"
        data-shortcut="${'@'}"
      ></affine-tooltip-content-with-shortcut>`}"
      .tooltipOffset=${17}
      class="edgeless-link-tool-button"
      @click=${this._onClick}
    >
      <span class="link-icon">${LinkIcon}</span>
    </edgeless-tool-icon-button>`;
  }
}
