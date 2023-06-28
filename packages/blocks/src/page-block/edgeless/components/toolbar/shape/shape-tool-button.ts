import '../../buttons/toolbar-button.js';
import './shape-menu.js';

import { EdgelessShapeIcon } from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import type { EdgelessTool } from '../../../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
} from '../../component-toolbar/change-shape-button.js';
import { createButtonPopper } from '../../utils.js';
import { getTooltipWithShortcut } from '../../utils.js';
import type { EdgelessShapeMenu } from './shape-menu.js';

@customElement('edgeless-shape-tool-button')
export class EdgelessShapeToolButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
    }
    edgeless-toolbar-button svg {
      transition: 0.3s ease-in-out;
    }
    edgeless-toolbar-button:hover svg {
      scale: 1.2;
    }
    edgeless-shape-menu {
      display: none;
    }
    edgeless-shape-menu[data-show] {
      display: block;
    }
  `;

  @property({ attribute: false })
  edgelessTool!: EdgelessTool;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  setEdgelessTool!: (edgelessTool: EdgelessTool) => void;

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
        this.setEdgelessTool({
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
    const type = this.edgelessTool?.type;
    const selectedShape =
      type === 'shape' ? this.edgelessTool.shape : undefined;

    return html`
      <edgeless-toolbar-button
        .tooltip=${this._popperShow ? '' : getTooltipWithShortcut('Shape', 'S')}
        .active=${type === 'shape'}
        .activeMode=${'background'}
        @click=${() => {
          this.setEdgelessTool({
            type: 'shape',
            shape: 'rect',
            fillColor: DEFAULT_SHAPE_FILL_COLOR,
            strokeColor: DEFAULT_SHAPE_STROKE_COLOR,
          });
          this._toggleShapeMenu();
        }}
      >
        ${EdgelessShapeIcon}
      </edgeless-toolbar-button>
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
