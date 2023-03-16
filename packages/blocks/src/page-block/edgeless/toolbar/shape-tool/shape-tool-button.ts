import '../../components/tool-icon-button.js';
import './shape-menu.js';

import { ShapeIcon } from '@blocksuite/global/config';
import { DisposableGroup } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import type {
  MouseMode,
  ShapeMouseMode,
} from '../../../../__internal__/index.js';
import { createButtonPopper } from '../../components/utils.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import type { EdgelessShapeMenu } from './shape-menu.js';

@customElement('edgeless-shape-tool-button')
export class EdgelessShapeToolButton extends LitElement {
  static styles = css`
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

  @query('edgeless-shape-menu')
  private _shapeMenu!: EdgelessShapeMenu;

  private _shapeMenuPopper: ReturnType<typeof createButtonPopper> | null = null;

  private _disposables: DisposableGroup = new DisposableGroup();

  private _toggleShapeMenu() {
    this._shapeMenuPopper?.toggle();
  }

  private _setMouseMode(mode: ShapeMouseMode) {
    this.edgeless.slots.mouseModeUpdated.emit(mode);
  }

  firstUpdated(changedProperties: Map<string, unknown>) {
    const _disposables = this._disposables;

    this._shapeMenuPopper = createButtonPopper(this, this._shapeMenu);
    _disposables.add(this._shapeMenuPopper);
    _disposables.add(
      this._shapeMenu.slots.select.on(shape => {
        this._setMouseMode({
          type: 'shape',
          shape,
          color: '#000000',
        });
      })
    );
    super.firstUpdated(changedProperties);
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mouseMode')) {
      this._shapeMenuPopper?.hide();
    }
    super.updated(changedProperties);
  }

  disconnectedCallback() {
    this._disposables?.dispose();
    super.disconnectedCallback();
  }

  render() {
    const type = this.mouseMode?.type;
    const selectedShape = type === 'shape' ? this.mouseMode.shape : undefined;

    return html`
      <edgeless-tool-icon-button
        .tooltip=${'Shape'}
        .active=${type === 'shape'}
        .testId=${'shape'}
        @tool.click=${() => this._toggleShapeMenu()}
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
