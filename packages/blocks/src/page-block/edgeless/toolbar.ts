import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Page } from '@blocksuite/store';
import {
  ConnectorIcon,
  DiamondIcon,
  EllipseIcon,
  HandIcon,
  ImageIcon,
  PenIcon,
  RoundedRectangleIcon,
  SelectIcon,
  ShapeIcon,
  SquareIcon,
  TriangleIcon,
} from '@blocksuite/global/config';

@customElement('edgeless-toolbar')
export class EdgelessToolBar extends LitElement {
  @property()
  page!: Page;

  _hidden = true;

  _selectedIcon = '';

  set hidden(hidden) {
    this._hidden = hidden;
  }

  get hidden() {
    return this._hidden;
  }

  static styles = css`
    :host {
      position: fixed;
      bottom: 28px;
      left: calc(50%);
      display: flex;
      width: 288px;
      justify-content: center;
      transform: translateX(-50%);
    }

    .edgeless-toolbar-container {
      display: flex;
      align-items: center;
      height: 48px;
      background: #ffffff;
      box-shadow: 0px 0px 12px rgba(66, 65, 73, 0.14);
      border-radius: 8px;
      fill: currentColor;
    }

    .edgeless-toolbar-container[level='second'] {
      position: absolute;
      bottom: 8px;
      transform: translateY(-100%);
    }

    .edgeless-toolbar-container[hidden] {
      display: none;
    }

    .icon-container {
      position: relative;
      display: flex;
      align-items: center;
      padding: 4px;
      color: var(--affine-line-number-color);
    }

    .icon-container[level='first'] {
      margin-right: 8px;
      margin-top: 8px;
      margin-bottom: 8px;
    }

    .icon-container[level='first']:first-child {
      margin-left: 8px;
    }

    .icon-container[level='second'] {
      fill: none;
      stroke: var(--affine-line-number-color);
      margin-top: 4px;
      margin-bottom: 4px;
      margin-right: 4px;
    }

    .icon-container[level='second']:first-child {
      margin-left: 4px;
    }

    .icon-container:hover,
    .icon-container[clicked] {
      background: var(--affine-hover-background);
      color: var(--affine-primary-color);
      border-radius: 5px;
    }
  `;

  private _toolsTemplate(
    config: Array<{
      name: string;
      icon: TemplateResult<2>;
      action?: (toolbar: EdgelessToolBar) => void;
    }>,
    level: 'first' | 'second'
  ) {
    return html`
      <div
        class="edgeless-toolbar-container"
        level="${level}"
        ?hidden=${level === 'second' && this._hidden}
      >
        ${config.map(({ name, icon, action }) => {
          return html`
            <div
              class="icon-container"
              level="${level}"
              ?clicked=${this._selectedIcon === name}
              @click=${() => {
                action && action(this);
                this._selectedIcon = this._selectedIcon === name ? '' : name;
                this.requestUpdate();
              }}
            >
              ${icon}
            </div>
          `;
        })}
      </div>
    `;
  }

  render() {
    return html`
      ${this._toolsTemplate(ToolsL1Config, 'first')}
      ${this._toolsTemplate(ToolsL2Config, 'second')}
    `;
  }
}

const ToolsL1Config = [
  {
    name: 'selection',
    icon: SelectIcon,
  },
  {
    name: 'shape',
    icon: ShapeIcon,
    action: (toolbar: EdgelessToolBar) => {
      toolbar.hidden = !toolbar.hidden;
    },
  },
  {
    name: 'image',
    icon: ImageIcon,
  },
  {
    name: 'connector',
    icon: ConnectorIcon,
  },
  {
    name: 'pen',
    icon: PenIcon,
  },
  {
    name: 'hand',
    icon: HandIcon,
  },
];

const ToolsL2Config = [
  {
    name: 'square',
    icon: SquareIcon,
  },
  {
    name: 'ellipse',
    icon: EllipseIcon,
  },
  {
    name: 'diamond',
    icon: DiamondIcon,
  },
  {
    name: 'triangle',
    icon: TriangleIcon,
  },
  {
    name: 'roundedRectangle',
    icon: RoundedRectangleIcon,
  },
];

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-toolbar': EdgelessToolBar;
  }
}
