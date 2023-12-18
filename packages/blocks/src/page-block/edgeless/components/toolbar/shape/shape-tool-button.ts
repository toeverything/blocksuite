import '../../buttons/toolbar-button.js';
import './shape-menu.js';
import './shape-tool-element.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  diamondSvg,
  ellipseSvg,
  rectSvg,
  roundedSvg,
  triangleSvg,
} from '../../../../../_common/icons/index.js';
import type {
  EdgelessTool,
  ShapeToolState,
} from '../../../../../_common/utils/index.js';
import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
} from '../../../../../surface-block/elements/shape/consts.js';
import { ShapeStyle } from '../../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import { getTooltipWithShortcut } from '../../utils.js';
import { createPopper, type MenuPopper } from '../common/create-popper.js';
import type { EdgelessShapeMenu } from './shape-menu.js';
import type { Shape, ShapeName } from './shape-tool-element.js';

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

    :host {
      --width: 102px;
      --height: 64px;
      position: relative;
      width: var(--width);
      height: var(--height);
    }

    .container-clip {
      padding: 10000px 10000px 0;
      margin: -10000px -10000px 0;
      overflow: hidden;
      pointer-events: none;
    }

    .shapes {
      height: var(--height);
      width: var(--width);
      color: #9747ff;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      pointer-events: auto;
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

  @state()
  private _shapeIconColor: string = DEFAULT_SHAPE_STROKE_COLOR;

  private _shapeToolLocalState: ShapeToolState | null = null;

  private _shapeMenu: MenuPopper<EdgelessShapeMenu> | null = null;

  private _openShapeMenu() {
    if (!this._shapeMenu) {
      this._shapeMenu = createPopper('edgeless-shape-menu', this, {
        x: -240,
        y: -40,
      });
      this._shapeMenu.element.edgelessTool = this.edgelessTool;
      this._shapeMenu.element.edgeless = this.edgeless;
    }
  }

  private _closeShapeMenu() {
    if (this._shapeMenu) {
      this._shapeMenu.dispose();
      this._shapeMenu = null;
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('edgelessTool')) {
      if (this.edgelessTool.type !== 'shape') {
        this._closeShapeMenu();
      }
      if (this._shapeMenu) {
        this._shapeMenu.element.edgelessTool = this.edgelessTool;
        this._shapeMenu.element.edgeless = this.edgeless;
      }
    }
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
    this.active(this._shapeToolLocalState?.shape ?? 'rect');

    this.updateComplete
      .then(() => {
        this._shapeIconColor =
          this._shapeToolLocalState?.strokeColor ?? DEFAULT_SHAPE_STROKE_COLOR;
      })
      .catch(console.error);

    this._disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(newTool => {
        if (newTool.type !== 'shape') {
          this._closeShapeMenu();
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
        this._shapeIconColor = newTool.strokeColor;
        //
        this.active(newTool.shape);

        // open secondary menu
        this._openShapeMenu();
      })
    );
  }

  override disconnectedCallback() {
    this._disposables.dispose();
    this._closeShapeMenu();
    super.disconnectedCallback();
  }

  override firstUpdated() {
    this.edgeless.bindHotKey(
      {
        Escape: () => {
          if (this.edgelessTool.type === 'shape') {
            this.setEdgelessTool({ type: 'default' });
          }
        },
      },
      { global: true }
    );
  }

  private _shapes: Array<Shape> = [
    { name: 'rect', svg: rectSvg },
    { name: 'triangle', svg: triangleSvg },
    { name: 'ellipse', svg: ellipseSvg },
    { name: 'diamond', svg: diamondSvg },
    { name: 'roundedRect', svg: roundedSvg },
  ];

  @state()
  private _data = {
    activeShape: this._shapes[0].name,
    order: this._shapes.map((_, i) => i + 1),
  };

  active(name: ShapeName) {
    const { order } = this._data;
    const index = this._shapes.findIndex(({ name: n }) => n === name);
    const prevOrder = order[index];
    const newOrder = order.map(o =>
      o < prevOrder ? o + 1 : o === prevOrder ? 1 : o
    );
    this._data.activeShape = name;
    this._data.order = newOrder;
  }

  getContainerRect = () => {
    return this.getBoundingClientRect();
  };

  handleClick = () => {
    if (this.edgelessTool.type !== 'shape') {
      this.setEdgelessTool({
        type: 'shape',
        shape: this._shapeToolLocalState?.shape ?? 'rect',
        fillColor:
          this._shapeToolLocalState?.fillColor ?? DEFAULT_SHAPE_FILL_COLOR,
        strokeColor:
          this._shapeToolLocalState?.strokeColor ?? DEFAULT_SHAPE_STROKE_COLOR,
        shapeStyle: this._shapeToolLocalState?.shapeStyle ?? ShapeStyle.General,
      });
    } else {
      this._closeShapeMenu();
      this.setEdgelessTool({ type: 'default' });
    }
  };

  override render() {
    const type = this.edgelessTool?.type;
    return html`
      <edgeless-toolbar-button
        class="edgeless-shape-button"
        .tooltip=${this._shapeMenu ? '' : getTooltipWithShortcut('Shape', 'S')}
        .tooltipOffset=${5}
        .active=${type === 'shape'}
      >
        <div class="container-clip">
          <div
            class="shapes"
            style=${styleMap({ color: `var(${this._shapeIconColor})` })}
          >
            ${repeat(this._shapes, (shape, index) => {
              return html`<edgeless-shape-tool-element
                .shape=${shape}
                .order=${this._data.order[index]}
                .getContainerRect=${this.getContainerRect}
                .handleClick=${this.handleClick}
                .edgeless=${this.edgeless}
                .setEdgelessTool=${this.setEdgelessTool}
              ></edgeless-shape-tool-element>`;
            })}
          </div>
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
