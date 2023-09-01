import '../../buttons/toolbar-button.js';
import './shape-menu.js';

import { WithDisposable } from '@blocksuite/lit';
import { ShapeStyle } from '@blocksuite/phasor';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import type {
  EdgelessTool,
  ShapeToolState,
} from '../../../../../__internal__/index.js';
import {
  ArrowUpIcon,
  EdgelessGeneralShapeIcon,
} from '../../../../../icons/index.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
} from '../../component-toolbar/change-shape-button.js';
import { getTooltipWithShortcut } from '../../utils.js';
import { createPopper, type MenuPopper } from '../common/create-popper.js';
import type { EdgelessShapeMenu } from './shape-menu.js';

@customElement('edgeless-shape-tool-button')
export class EdgelessShapeToolButton extends WithDisposable(LitElement) {
  static override styles = css`
    .shape-button-group {
      display: block;
      position: relative;
      width: 72px;
      height: 48px;
    }

    edgeless-toolbar-button svg {
      transition: 0.3s ease-in-out;
    }

    edgeless-toolbar-button:hover svg {
      scale: 1.15;
    }

    edgeless-toolbar-button svg + svg {
      position: absolute;
      top: 6px;
      right: 4px;
    }
  `;

  @property({ attribute: false })
  edgelessTool!: EdgelessTool;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  setEdgelessTool!: (edgelessTool: EdgelessTool) => void;

  @property({ attribute: false })
  shapeStyle?: ShapeStyle = ShapeStyle.Scribbled;

  @query('.shape-icon-shape-group')
  private _shapeIconShapeGroup!: HTMLElement;

  private _shapeToolLocalState: ShapeToolState | null = null;

  private _shapeMenu: MenuPopper<EdgelessShapeMenu> | null = null;

  private _toggleShapeMenu() {
    if (this._shapeMenu) {
      this._shapeMenu.dispose();
      this._shapeMenu = null;
    } else {
      this._shapeMenu = createPopper('edgeless-shape-menu', this, {
        x: 110,
        y: -40,
      });
      this._shapeMenu.element.edgelessTool = this.edgelessTool;
      this._shapeMenu.element.edgeless = this.edgeless;
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('edgelessTool')) {
      if (this.edgelessTool.type !== 'shape') {
        this._shapeMenu?.dispose();
        this._shapeMenu = null;
      }
      if (this._shapeMenu) {
        this._shapeMenu.element.edgelessTool = this.edgelessTool;
        this._shapeMenu.element.edgeless = this.edgeless;
      }
    }
  }

  private _setShapeIconColor(color: string) {
    this._shapeIconShapeGroup.style.fill = `var(${color})`;
  }

  private _tryLoadShapeLocalState() {
    const key = 'blocksuite:' + this.edgeless.page.id + ':edgelessShape';
    const shapeData = sessionStorage.getItem(key);
    let shapeToolState = null;
    if (shapeData) {
      shapeToolState = JSON.parse(shapeData);
    }

    return shapeToolState;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._shapeToolLocalState = this._tryLoadShapeLocalState();

    this.updateComplete.then(() => {
      const color =
        this._shapeToolLocalState?.strokeColor ?? DEFAULT_SHAPE_STROKE_COLOR;
      this._setShapeIconColor(color);
    });

    this._disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(newTool => {
        if (newTool.type !== 'shape') {
          this._shapeMenu?.dispose();
          this._shapeMenu = null;
          return;
        }

        const shapeToolState = {
          shape: newTool.shape,
          fillColor: newTool.fillColor,
          shapeStyle: newTool.shapeStyle,
          strokeColor: newTool.strokeColor,
        };

        // Save shape tool state to session storage
        sessionStorage.setItem(
          'blocksuite:' + this.edgeless.page.id + ':edgelessShape',
          JSON.stringify(shapeToolState)
        );

        this._shapeToolLocalState = shapeToolState;
        // Update shape icon color
        const color = newTool.strokeColor;
        this._setShapeIconColor(color);
      })
    );
  }

  override disconnectedCallback() {
    this._disposables.dispose();
    this._shapeMenu?.dispose();
    this._shapeMenu = null;
    super.disconnectedCallback();
  }

  override render() {
    const type = this.edgelessTool?.type;

    return html`
      <edgeless-toolbar-button
        .tooltip=${this._shapeMenu ? '' : getTooltipWithShortcut('Shape', 'S')}
        .active=${type === 'shape'}
        .activeMode=${'background'}
        .iconContainerPadding=${0}
        @click=${() => {
          this.setEdgelessTool({
            type: 'shape',
            shape: this._shapeToolLocalState?.shape ?? 'rect',
            fillColor:
              this._shapeToolLocalState?.fillColor ?? DEFAULT_SHAPE_FILL_COLOR,
            strokeColor:
              this._shapeToolLocalState?.strokeColor ??
              DEFAULT_SHAPE_STROKE_COLOR,
            shapeStyle:
              this._shapeToolLocalState?.shapeStyle ?? ShapeStyle.Scribbled,
          });
          this._toggleShapeMenu();
        }}
      >
        <div class="shape-button-group">
          ${EdgelessGeneralShapeIcon} ${ArrowUpIcon}
        </div>
      </edgeless-toolbar-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-shape-tool-button': EdgelessShapeToolButton;
  }
}
