import '../../buttons/toolbar-button.js';
import './text-menu.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { type EdgelessTool } from '../../../../../__internal__/index.js';
import { EdgelessTextIcon } from '../../../../../icons/index.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import { GET_DEFAULT_TEXT_COLOR } from '../../panel/color-panel.js';
import { getTooltipWithShortcut } from '../../utils.js';
import { createPopper, type MenuPopper } from '../common/create-popper.js';
import type { EdgelessTextMenu } from './text-menu.js';

@customElement('edgeless-text-tool-button')
export class EdgelessTextToolButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
    }
    .edgeless-text-button {
      position: relative;
      width: 53px;
      height: 44px;
      overflow-y: hidden;
    }
  `;

  @property({ attribute: false })
  edgelessTool!: EdgelessTool;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  setEdgelessTool!: (edgelessTool: EdgelessTool) => void;

  @state()
  private _color: string = GET_DEFAULT_TEXT_COLOR();

  private _textMenu: MenuPopper<EdgelessTextMenu> | null = null;

  private _toggleTextMenu() {
    if (this._textMenu) {
      this._textMenu.dispose();
      this._textMenu = null;
    } else {
      this._textMenu = createPopper('edgeless-text-menu', this, {
        x: 300,
        y: -40,
      });
      this._textMenu.element.edgelessTool = this.edgelessTool;
      this._textMenu.element.edgeless = this.edgeless;
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('edgelessTool')) {
      if (this.edgelessTool.type !== 'text') {
        this._textMenu?.dispose();
        this._textMenu = null;
      }
      if (this._textMenu) {
        this._textMenu.element.edgelessTool = this.edgelessTool;
        this._textMenu.element.edgeless = this.edgeless;
      }
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(newTool => {
        if (newTool.type === 'text') {
          this._color = newTool.color;
        } else {
          this._textMenu?.dispose();
          this._textMenu = null;
        }
      })
    );
  }

  override disconnectedCallback(): void {
    this._disposables.dispose();
    this._textMenu?.dispose();
    this._textMenu = null;
    super.disconnectedCallback();
  }

  override render() {
    const type = this.edgelessTool?.type;

    return html`
      <edgeless-toolbar-button
        .tooltip=${this._textMenu ? '' : getTooltipWithShortcut('Text', 'T')}
        .active=${type === 'text'}
        .activeMode=${'background'}
        @click=${() => {
          this.setEdgelessTool({
            type: 'text',
            color: GET_DEFAULT_TEXT_COLOR(),
          });
          this._toggleTextMenu();
        }}
      >
        <div class="edgeless-text-button">
          <div class=${type === 'text' ? 'active-mode' : ''}></div>
          <div style=${styleMap({ color: `var(${this._color})` })}>
            ${EdgelessTextIcon}
          </div>
        </div>
      </edgeless-toolbar-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-text-tool-button': EdgelessTextToolButton;
  }
}
