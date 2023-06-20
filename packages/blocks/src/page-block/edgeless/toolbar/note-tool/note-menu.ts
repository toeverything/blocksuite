import {
  CodeIcon,
  DividerBlockIcon,
  Heading1BlockIcon,
  Heading2BlockIcon,
  Heading3BlockIcon,
  Heading4BlockIcon,
  Heading5BlockIcon,
  Heading6BlockIcon,
  ListIcon,
  TextBlockIcon,
} from '@blocksuite/global/config';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { MouseMode } from '../../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';

@customElement('edgeless-note-menu')
export class EdgelessNoteMenu extends LitElement {
  static override styles = css`
    :host {
      position: absolute;
      height: 68px;
      display: flex;
      z-index: -1;
    }
    .note-menu-container {
      display: flex;
      align-items: center;
      flex-direction: column;
      gap: 12px;
      padding: 0 20px;
      background: var(--affine-background-overlay-panel-color);
      fill: currentcolor;
    }
    .button-group-container {
      display: flex;
      justify-content: center;
      align-items: center;
      background: var(--affine-background-overlay-panel-color);
      border: 1px solid var(--affine-border-color);
      border-radius: 8px 8px 0 0;
    }
    .button-group-label {
      font-family: 'Avenir Next';
      font-size: 12px;
      font-weight: 400;
      font-style: normal;
      margin-left: 12px;
      line-height: 16px;
      display: flex;
      align-items: center;
      text-align: center;
      color: var(--affine-text-disable-color);
    }
    .button-group-container > :is(edgeless-tool-icon-button) > svg {
      fill: currentColor;
    }
  `;
  private iconButtonStyles = `
    --hover-color: var(--affine-hover-color);
    --active-color: var(--affine-primary-color);
  `;

  @property()
  mouseMode!: MouseMode;

  @property()
  edgeless!: EdgelessPageBlockComponent;

  override render() {
    if (this.mouseMode.type !== 'note') return nothing;

    return html`
      <div class="note-memu-container">
        <div class="button-group-container">
          <div class="button-group-label">Blocks</div>
          <edgeless-tool-icon-button style=${this.iconButtonStyles}>
            ${TextBlockIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button style=${this.iconButtonStyles}>
            ${Heading1BlockIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button style=${this.iconButtonStyles}>
            ${Heading2BlockIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button style=${this.iconButtonStyles}>
            ${Heading3BlockIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button style=${this.iconButtonStyles}>
            ${Heading4BlockIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button style=${this.iconButtonStyles}>
            ${Heading5BlockIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button style=${this.iconButtonStyles}>
            ${Heading6BlockIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button style=${this.iconButtonStyles}>
            ${CodeIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button style=${this.iconButtonStyles}>
            ${ListIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button style=${this.iconButtonStyles}>
            ${DividerBlockIcon}
          </edgeless-tool-icon-button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-note-menu': EdgelessNoteMenu;
  }
}
