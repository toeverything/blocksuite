import '../../buttons/tool-icon-button.js';
import './frame-menu.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessTool } from '../../../../../__internal__/index.js';
import { ArrowUpIcon, LargeFrameIcon } from '../../../../../icons/index.js';
import { getTooltipWithShortcut } from '../../../components/utils.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import { createPopper, type MenuPopper } from '../common/create-popper.js';
import type { EdgelessFrameMenu } from './frame-menu.js';

@customElement('edgeless-frame-tool-button')
export class EdgelessFrameToolButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
    }

    .frame-button-group {
      display: flex;
      position: relative;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
    }

    edgeless-tool-icon-button svg + svg {
      position: absolute;
      top: 2px;
      right: 0px;
    }
  `;

  @property({ attribute: false })
  edgelessTool!: EdgelessTool;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  setEdgelessTool!: (edgelessTool: EdgelessTool) => void;

  private _frameMenu: MenuPopper<EdgelessFrameMenu> | null = null;

  private _toggleFrameMenu() {
    if (this._frameMenu) {
      this._frameMenu.dispose();
      this._frameMenu = null;
    } else {
      this._frameMenu = createPopper('edgeless-frame-menu', this, {
        x: 90,
        y: -40,
      });
      this._frameMenu.element.edgelessTool = this.edgelessTool;
      this._frameMenu.element.edgeless = this.edgeless;
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('edgelessTool')) {
      if (this.edgelessTool.type !== 'frame') {
        this._frameMenu?.dispose();
        this._frameMenu = null;
      }
      if (this._frameMenu) {
        this._frameMenu.element.edgelessTool = this.edgelessTool;
        this._frameMenu.element.edgeless = this.edgeless;
      }
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(newTool => {
        if (newTool.type !== 'frame') {
          this._frameMenu?.dispose();
          this._frameMenu = null;
        }
      })
    );
  }

  override disconnectedCallback() {
    this._frameMenu?.dispose();
    this._frameMenu = null;
    super.disconnectedCallback();
  }

  override render() {
    const type = this.edgelessTool?.type;

    return html`
      <edgeless-tool-icon-button
        .tooltip=${this._frameMenu ? '' : getTooltipWithShortcut('Frame', 'F')}
        .active=${type === 'frame'}
        .iconContainerPadding=${0}
        @click=${() => {
          this.setEdgelessTool({
            type: 'frame',
          });
          this._toggleFrameMenu();
        }}
      >
        <div class="frame-button-group">${LargeFrameIcon} ${ArrowUpIcon}</div>
      </edgeless-tool-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-frame-tool-button': EdgelessFrameToolButton;
  }
}
