import '../../buttons/tool-icon-button.js';
import './frame-menu.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  ArrowUpIcon,
  LargeFrameIcon,
} from '../../../../../_common/icons/index.js';
import type { EdgelessTool } from '../../../../../_common/utils/index.js';
import { getTooltipWithShortcut } from '../../../components/utils.js';
import type { EdgelessRootBlockComponent } from '../../../edgeless-root-block.js';
import { createPopper, type MenuPopper } from '../common/create-popper.js';
import type { EdgelessFrameMenu } from './frame-menu.js';

@customElement('edgeless-frame-tool-button')
export class EdgelessFrameToolButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
    }

    .arrow-up-icon {
      position: absolute;
      top: 4px;
      right: 2px;
      font-size: 0;
    }
  `;

  @property({ attribute: false })
  edgelessTool!: EdgelessTool;

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

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
    const arrowColor = type === 'frame' ? 'currentColor' : '#77757D';
    return html`
      <edgeless-tool-icon-button
        class="edgeless-frame-button"
        .tooltip=${this._frameMenu ? '' : getTooltipWithShortcut('Frame', 'F')}
        .tooltipOffset=${17}
        .active=${type === 'frame'}
        .iconContainerPadding=${8}
        @click=${() => {
          this.setEdgelessTool({
            type: 'frame',
          });
          this._toggleFrameMenu();
        }}
      >
        ${LargeFrameIcon}
        <span class="arrow-up-icon" style=${styleMap({ color: arrowColor })}>
          ${ArrowUpIcon}
        </span>
      </edgeless-tool-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-frame-tool-button': EdgelessFrameToolButton;
  }
}
