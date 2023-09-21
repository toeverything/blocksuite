import '../../buttons/toolbar-button.js';
import './brush-menu.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  type EdgelessTool,
  LineWidth,
} from '../../../../../__internal__/index.js';
import { EdgelessPenIcon } from '../../../../../icons/index.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import { DEFAULT_BRUSH_COLOR } from '../../panel/color-panel.js';
import { getTooltipWithShortcut } from '../../utils.js';
import { createPopper, type MenuPopper } from '../common/create-popper.js';
import type { EdgelessBrushMenu } from './brush-menu.js';

@customElement('edgeless-brush-tool-button')
export class EdgelessBrushToolButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
    }
    .edgeless-brush-button {
      position: relative;
      height: 66px;
      width: 40px;
      overflow-y: hidden;
    }
    .active-mode {
      position: absolute;
      top: 4px;
      left: 5px;
      width: 30px;
      height: 66px;
      border-top-left-radius: 22px;
      border-top-right-radius: 22px;
      background: var(--affine-hover-color);
    }
    #edgeless-pen-icon {
      position: absolute;
      left: 3px;
      transform: translateY(10px);
      transition: transform 0.3s ease-in-out;
    }
    #edgeless-pen-icon:hover {
      transform: translateY(5px);
    }
  `;

  @property({ attribute: false })
  edgelessTool!: EdgelessTool;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  setEdgelessTool!: (edgelessTool: EdgelessTool) => void;

  @state()
  private _color: string = DEFAULT_BRUSH_COLOR;

  private _brushMenu: MenuPopper<EdgelessBrushMenu> | null = null;

  private _toggleBrushMenu() {
    if (this._brushMenu) {
      this._brushMenu.dispose();
      this._brushMenu = null;
    } else {
      this._brushMenu = createPopper('edgeless-brush-menu', this, {
        x: 110,
        y: -40,
      });
      this._brushMenu.element.edgelessTool = this.edgelessTool;
      this._brushMenu.element.edgeless = this.edgeless;
    }
  }

  private _tryLoadBrushStateLocalColor() {
    const key = 'blocksuite:' + this.edgeless.page.id + ':edgelessBrush';
    const brushData = sessionStorage.getItem(key);
    let color = null;
    if (brushData) {
      color = JSON.parse(brushData).color;
      this._color = color;
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('edgelessTool')) {
      if (this.edgelessTool.type !== 'brush') {
        this._brushMenu?.dispose();
        this._brushMenu = null;
      }
      if (this._brushMenu) {
        this._brushMenu.element.edgelessTool = this.edgelessTool;
        this._brushMenu.element.edgeless = this.edgeless;
      }
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.updateComplete.then(() => {
      this._tryLoadBrushStateLocalColor();
    });
    this._disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(newTool => {
        if (newTool.type === 'brush') {
          this._color = newTool.color;
        } else {
          this._brushMenu?.dispose();
          this._brushMenu = null;
        }
      })
    );
  }

  override disconnectedCallback(): void {
    this._disposables.dispose();
    this._brushMenu?.dispose();
    this._brushMenu = null;
    super.disconnectedCallback();
  }

  override render() {
    const type = this.edgelessTool?.type;

    return html`
      <edgeless-toolbar-button
        .tooltip=${this._brushMenu ? '' : getTooltipWithShortcut('Pen', 'P')}
        .active=${type === 'brush'}
        @click=${() => {
          this.setEdgelessTool({
            type: 'brush',
            lineWidth: LineWidth.LINE_WIDTH_FOUR,
            color: DEFAULT_BRUSH_COLOR,
          });
          this._toggleBrushMenu();
        }}
      >
        <div class="edgeless-brush-button">
          <div class=${type === 'brush' ? 'active-mode' : ''}></div>
          <div style=${styleMap({ color: `var(${this._color})` })}>
            ${EdgelessPenIcon}
          </div>
        </div>
      </edgeless-toolbar-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-brush-tool-button': EdgelessBrushToolButton;
  }
}
