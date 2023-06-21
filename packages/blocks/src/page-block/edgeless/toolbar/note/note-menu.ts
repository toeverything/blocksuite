import {
  BookmarkIcon,
  BulletedListIcon,
  CodeBlockIcon,
  DatabaseTableViewIcon,
  DividerIcon,
  H1Icon,
  H2Icon,
  H3Icon,
  H4Icon,
  H5Icon,
  H6Icon,
  ImageIcon,
  NumberedListIcon,
  QuoteIcon,
  TextIcon,
  TodoIcon,
} from '@blocksuite/global/config';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessTool } from '../../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';

@customElement('edgeless-note-menu')
export class EdgelessNoteMenu extends LitElement {
  static override styles = css`
    :host {
      position: absolute;
      height: 70px;
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

  @property()
  edgelessTool!: EdgelessTool;

  @property()
  edgeless!: EdgelessPageBlockComponent;

  override render() {
    if (this.edgelessTool.type !== 'note') return nothing;

    return html`
      <div class="note-memu-container">
        <div class="button-group-container">
          <div class="button-group-label">Blocks</div>
          <edgeless-tool-icon-button>
            ${TextIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button>
            ${H1Icon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button>
            ${H2Icon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button>
            ${H3Icon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button>
            ${H4Icon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button>
            ${H5Icon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button>
            ${H6Icon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button>
            ${CodeBlockIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button>
            ${QuoteIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button>
            ${DividerIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button>
            ${BulletedListIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button>
            ${NumberedListIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button>
            ${TodoIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button>
            ${ImageIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button>
            ${BookmarkIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button>
            ${DatabaseTableViewIcon}
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
