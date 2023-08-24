import '../../buttons/tool-icon-button.js';
import './shape-menu.js';

import { assertExists } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { ShapeStyle } from '@blocksuite/phasor';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessTool } from '../../../../../__internal__/index.js';
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
import type { EdgelessShapeMenu } from './shape-menu.js';

interface ShapeMenuPopper {
  element: EdgelessShapeMenu;
  dispose: () => void;
}

function createShapeMenuPopper(reference: HTMLElement): ShapeMenuPopper {
  const shapeMenu = document.createElement('edgeless-shape-menu');
  assertExists(reference.shadowRoot);
  reference.shadowRoot.appendChild(shapeMenu);

  // The brush menu should be positioned at the top of the brush button.
  // And it should be positioned at the top center of the toolbar all the time.
  const x = 110;
  const y = -40;

  Object.assign(shapeMenu.style, {
    left: `${x}px`,
    top: `${y}px`,
  });

  return {
    element: shapeMenu,
    dispose: () => {
      shapeMenu.remove();
    },
  };
}

@customElement('edgeless-shape-tool-button')
export class EdgelessShapeToolButton extends WithDisposable(LitElement) {
  static override styles = css`
    .shape-button-group {
      display: block;
      position: relative;
      width: 72px;
      height: 48px;
    }

    edgeless-tool-icon-button svg {
      transition: 0.3s ease-in-out;
    }

    edgeless-tool-icon-button:hover svg {
      scale: 1.15;
    }

    edgeless-tool-icon-button svg + svg {
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

  private _shapeMenu: ShapeMenuPopper | null = null;

  private _toggleShapeMenu() {
    if (this._shapeMenu) {
      this._shapeMenu.dispose();
      this._shapeMenu = null;
    } else {
      this._shapeMenu = createShapeMenuPopper(this);
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

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(newTool => {
        if (newTool.type !== 'shape') {
          this._shapeMenu?.dispose();
          this._shapeMenu = null;
          return;
        }

        const { shapeStyle } = newTool;
        this.shapeStyle = shapeStyle;
      })
    );
  }

  override disconnectedCallback() {
    this._shapeMenu?.dispose();
    this._shapeMenu = null;
    super.disconnectedCallback();
  }

  override render() {
    const type = this.edgelessTool?.type;

    return html`
      <edgeless-tool-icon-button
        .tooltip=${this._shapeMenu ? '' : getTooltipWithShortcut('Shape', 'S')}
        .active=${type === 'shape'}
        .activeMode=${'background'}
        .iconContainerPadding=${0}
        @click=${() => {
          this.setEdgelessTool({
            type: 'shape',
            shape: 'rect',
            fillColor: DEFAULT_SHAPE_FILL_COLOR,
            strokeColor: DEFAULT_SHAPE_STROKE_COLOR,
            shapeStyle: ShapeStyle.Scribbled,
          });
          this._toggleShapeMenu();
        }}
      >
        <div class="shape-button-group">
          ${EdgelessGeneralShapeIcon} ${ArrowUpIcon}
        </div>
      </edgeless-tool-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-shape-tool-button': EdgelessShapeToolButton;
  }
}
