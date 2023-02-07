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
  TextIconLarge,
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
      background: var(--affine-page-background);
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
      background: var(--affine-hover-background);
    }

    .icon-container[clicked] {
      background: var(--affine-hover-background);
      stroke: var(--affine-primary-color);
    }

    .icon-container[disabled] {
      cursor: not-allowed;
      stroke: var(--affine-disable-color);
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
      this._dispatchSwitchMouseMode();
    }
  }

  private _dispatchSwitchMouseMode() {
    const event = createEvent('affine.switch-mouse-mode', this.mouseMode);
    window.dispatchEvent(event);
  }

  private _setMouseMode = (
    mouseModeType: MouseMode['type'],
    selectedShape: string,
    shapeModeShape?: ShapeMouseMode['shape'],
    shapeModeColor?: ShapeMouseMode['color']
  ) => {
    this.mouseModeType = mouseModeType;
    this.selectedShape = selectedShape;
    shapeModeShape && (this.shapeModeShape = shapeModeShape);
    shapeModeColor && (this.shapeModeColor = shapeModeColor);
  };

  private _resetMouseMode = () => {
    this._setMouseMode('default', '');
  };

  disconnectedCallback() {
    this.mouseModeType = 'default';
    this._dispatchSwitchMouseMode();
    super.disconnectedCallback();
  }

  render() {
    return html`
      <div class="shape-component-container">
        ${ShapeComponentConfig.map(({ name, value, icon, disabled }) => {
          return html`
            <div
              class="icon-container"
              role=${name}
              ?disabled=${disabled}
              ?clicked=${this.selectedShape === name}
              @click=${() => {
                if (!disabled) {
                  if (this.selectedShape === name) this._resetMouseMode();
                  else this._setMouseMode('shape', name, value);
                }
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
  static styles = css`
    :host {
      position: absolute;
      z-index: 1;
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
      color: var(--affine-primary-color);
    }

    .icon-container[disabled] {
      cursor: not-allowed;
      color: var(--affine-disable-color);
    }

    arrow-tool-tip {
      transform: translateX(-50%) translateY(-50%);
      left: calc(50%);
      bottom: 24px;
      opacity: 0;
    }

    .icon-container:hover > arrow-tool-tip {
      opacity: 1;
      transition-delay: 200ms;
    }
  `;

  @property()
  page!: Page;

  @property()
  secondaryToolBar: HTMLElement | null = null;

  @property()
  secondaryToolBarName = '';

  @state()
  _selectedIcon = '';

  private _cleanSecondaryToolBar() {
    if (this.secondaryToolBar) {
      this.secondaryToolBarName = '';
      this.secondaryToolBar.remove();
      this.secondaryToolBar = null;
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._cleanSecondaryToolBar();
  }

  render() {
    return html`
      <div class="edgeless-toolbar-container">
        ${ToolbarConfig.map(({ name, icon, disabled, action }) => {
          return html`
            <div
              class="icon-container"
              role=${name}
              ?disabled=${disabled}
              ?clicked=${this._selectedIcon === name}
              @click=${() => {
                if (!disabled) {
                  action ? action(this) : this._cleanSecondaryToolBar();
                  this._selectedIcon = this._selectedIcon === name ? '' : name;
                }
              }}
            >
              ${icon}
              <arrow-tool-tip .tipText="${name}"></arrow-tool-tip>
            </div>
          `;
        })}
      </div>
    `;
  }
}

const ToolbarConfig: Array<{
  name: string;
  icon: TemplateResult<2>;
  disabled: boolean;
  action?: (toolbar: EdgelessToolBar) => void;
}> = [
  {
    name: 'selection',
    icon: SelectIcon,
    disabled: true,
  },
  {
    name: 'text',
    icon: TextIconLarge,
    disabled: true,
  },
  {
    name: 'shape',
    icon: ShapeIcon,
    disabled: false,
    action: (toolbar: EdgelessToolBar) => {
      if (toolbar.secondaryToolBarName === 'shape') {
        assertExists(toolbar.secondaryToolBar);
        toolbar.secondaryToolBarName = '';
        toolbar.secondaryToolBar.remove();
        toolbar.secondaryToolBar = null;
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
    disabled: true,
  },
  {
    name: 'connector',
    icon: ConnectorIcon,
    disabled: true,
  },
  {
    name: 'pen',
    icon: PenIcon,
    disabled: true,
  },
  {
    name: 'hand',
    icon: HandIcon,
    disabled: true,
  },
];

const ShapeComponentConfig: Array<{
  name: string;
  value: ShapeMouseMode['shape'];
  icon: TemplateResult<2>;
  disabled: boolean;
}> = [
  {
    name: 'square',
    value: 'rect',
    icon: SquareIcon,
    disabled: true,
  },
  {
    name: 'ellipse',
    // TODO update new shape value
    value: 'rect',
    icon: EllipseIcon,
    disabled: true,
  },
  {
    name: 'diamond',
    // TODO update new shape value
    value: 'rect',
    icon: DiamondIcon,
    disabled: true,
  },
  {
    name: 'triangle',
    value: 'triangle',
    icon: TriangleIcon,
    disabled: true,
  },
  {
    name: 'roundedRectangle',
    // TODO update new shape value
    value: 'rect',
    icon: RoundedRectangleIcon,
    disabled: false,
  },
];

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-toolbar': EdgelessToolBar;
    'shape-component': ShapeComponent;
  }
}
