import '../../components/tool-icon-button.js';
import './shape-menu.js';

import { ShapeIcon } from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import type { MouseMode } from '../../../../__internal__/index.js';
import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
} from '../../components/component-toolbar/change-shape-button.js';
import { createButtonPopper } from '../../components/utils.js';
import { getTooltipWithShortcut } from '../../components/utils.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import type { EdgelessShapeMenu } from './shape-menu.js';

@customElement('edgeless-shape-tool-button')
export class EdgelessShapeToolButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
    }

    edgeless-shape-menu {
      display: none;
    }

    edgeless-shape-menu[data-show] {
      display: block;
    }
  `;

  @property()
  mouseMode!: MouseMode;

  @property()
  edgeless!: EdgelessPageBlockComponent;

  @property()
  setMouseMode!: (mouseMode: MouseMode) => void;

  @state()
  private _popperShow = false;

  @query('edgeless-shape-menu')
  private _shapeMenu!: EdgelessShapeMenu;

  private _shapeMenuPopper: ReturnType<typeof createButtonPopper> | null = null;

  private _toggleShapeMenu() {
    this._shapeMenuPopper?.toggle();
  }

  override firstUpdated(changedProperties: Map<string, unknown>) {
    const _disposables = this._disposables;

    this._shapeMenuPopper = createButtonPopper(
      this,
      this._shapeMenu,
      ({ display }) => {
        this._popperShow = display === 'show';
      }
    );
    _disposables.add(this._shapeMenuPopper);
    _disposables.add(
      this._shapeMenu.slots.select.on(shape => {
        this.setMouseMode({
          type: 'shape',
          shape,
          fillColor: DEFAULT_SHAPE_FILL_COLOR,
          strokeColor: DEFAULT_SHAPE_STROKE_COLOR,
        });
      })
    );
    super.firstUpdated(changedProperties);
  }

  override disconnectedCallback() {
    this._disposables?.dispose();
    super.disconnectedCallback();
  }

  override render() {
    const type = this.mouseMode?.type;
    const selectedShape = type === 'shape' ? this.mouseMode.shape : undefined;

    return html`
      <edgeless-tool-icon-button
        .tooltip=${this._popperShow ? '' : getTooltipWithShortcut('Shape', 'S')}
        .active=${type === 'shape'}
        @click=${() => {
          this.setMouseMode({
            type: 'shape',
            shape: 'rect',
            fillColor: DEFAULT_SHAPE_FILL_COLOR,
            strokeColor: DEFAULT_SHAPE_STROKE_COLOR,
          });
          this._toggleShapeMenu();
        }}
      >
        ${ShapeIcon}
      </edgeless-tool-icon-button>
      <edgeless-shape-menu .selectedShape=${selectedShape}>
      </edgeless-shape-menu>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-shape-tool-button': EdgelessShapeToolButton;
  }
}
