import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
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
import { createPopper } from '@popperjs/core';
import {
  createEvent,
  MouseMode,
  ShapeMouseMode,
} from '../../__internal__/index.js';
import { assertExists } from '@blocksuite/global/utils';

@customElement('shape-component')
export class ShapeComponent extends LitElement {
  static styles = css`
    .shape-component-container {
      display: flex;
      align-items: center;
      height: 48px;
      background: #ffffff;
      box-shadow: 0px 0px 12px rgba(66, 65, 73, 0.14);
      border-radius: 8px;
      fill: currentColor;
    }

    .icon-container {
      position: relative;
      display: flex;
      align-items: center;
      padding: 4px;
      fill: none;
      stroke: var(--affine-line-number-color);
      margin-top: 4px;
      margin-bottom: 4px;
      margin-right: 8px;
      border-radius: 5px;
    }

    .icon-container:first-child {
      margin-left: 8px;
    }

    .icon-container:hover {
      background: #f7f7f7;
    }
    .icon-container[clicked] {
      background: #f1eefe;
      stroke: #5438ff;
    }
  `;

  @property()
  mouseModeType: MouseMode['type'] = 'default';

  @property()
  shapeModeShape: ShapeMouseMode['shape'] = 'rect';

  @property()
  shapeModeColor: ShapeMouseMode['color'] = '#000000';

  @state()
  selectedShape = '';

  get mouseMode(): MouseMode {
    if (this.mouseModeType === 'default') {
      return {
        type: this.mouseModeType,
      };
    } else {
      return {
        type: this.mouseModeType,
        color: this.shapeModeColor,
        shape: this.shapeModeShape,
      };
    }
  }

  protected updated(changedProperties: Map<string, unknown>) {
    if (
      changedProperties.has('mouseModeType') ||
      changedProperties.has('shapeModeColor') ||
      changedProperties.has('shapeModeShape')
    ) {
      this._switchMouseMode();
    }
  }

  private _switchMouseMode() {
    const event = createEvent('affine.switch-mouse-mode', this.mouseMode);
    window.dispatchEvent(event);
  }

  disconnectedCallback() {
    this.mouseModeType = 'default';
    this._switchMouseMode();
    super.disconnectedCallback();
  }

  render() {
    return html`
      <div class="shape-component-container">
        ${ShapeComponentConfig.map(({ name, value, icon }) => {
          return html`
            <div
              class="icon-container"
              ?clicked=${this.selectedShape === name}
              @click=${() => {
                this.mouseModeType = 'shape';
                this.shapeModeShape = value;
                this.selectedShape = name;
                console.log('this._selectedShape', this.selectedShape);
              }}
            >
              ${icon}
            </div>
          `;
        })}
      </div>
    `;
  }
}

@customElement('edgeless-toolbar')
export class EdgelessToolBar extends LitElement {
  @property()
  page!: Page;

  @property()
  secondaryToolBar: HTMLElement | null = null;

  @property()
  secondaryToolBarName = '';

  @state()
  _selectedIcon = '';

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
      margin-right: 8px;
      margin-top: 8px;
      margin-bottom: 8px;
      border-radius: 5px;
    }

    .icon-container:first-child {
      margin-left: 8px;
    }

    .icon-container:hover {
      background: #f7f7f7;
    }
    .icon-container[clicked] {
      background: #f1eefe;
      color: #5438ff;
    }
  `;

  render() {
    return html`
      <div class="edgeless-toolbar-container">
        ${ToolbarConfig.map(({ name, icon, action }) => {
          return html`
            <div
              class="icon-container"
              ?clicked=${this._selectedIcon === name}
              @click=${() => {
                action && action(this);
                this._selectedIcon = this._selectedIcon === name ? '' : name;
              }}
            >
              ${icon}
            </div>
          `;
        })}
      </div>
    `;
  }
}

const ToolbarConfig = [
  {
    name: 'selection',
    icon: SelectIcon,
  },
  {
    name: 'shape',
    icon: ShapeIcon,
    action: (toolbar: EdgelessToolBar) => {
      if (toolbar.secondaryToolBarName === 'shape') {
        assertExists(toolbar.secondaryToolBar);
        toolbar.secondaryToolBarName = '';
        toolbar.secondaryToolBar.remove();
        return;
      }
      const shapeComponent = document.createElement('shape-component');
      toolbar.secondaryToolBarName = 'shape';
      toolbar.secondaryToolBar = shapeComponent;
      document.body.appendChild(shapeComponent);
      createPopper(toolbar, shapeComponent, {
        placement: 'top',
        modifiers: [
          {
            name: 'offset',
            options: { offset: [0, 12] },
          },
        ],
      });
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

const ShapeComponentConfig: Array<{
  name: string;
  value: ShapeMouseMode['shape'];
  icon: TemplateResult<2>;
}> = [
  {
    name: 'square',
    value: 'rect',
    icon: SquareIcon,
  },
  {
    name: 'ellipse',
    // TODO update new shape value
    value: 'rect',
    icon: EllipseIcon,
  },
  {
    name: 'diamond',
    // TODO update new shape value
    value: 'rect',
    icon: DiamondIcon,
  },
  {
    name: 'triangle',
    value: 'triangle',
    icon: TriangleIcon,
  },
  {
    name: 'roundedRectangle',
    // TODO update new shape value
    value: 'rect',
    icon: RoundedRectangleIcon,
  },
];

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-toolbar': EdgelessToolBar;
    'shape-component': ShapeComponent;
  }
}
