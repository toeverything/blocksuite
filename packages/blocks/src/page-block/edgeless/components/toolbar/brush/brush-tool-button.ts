import '../../buttons/toolbar-button.js';
import './brush-menu.js';

import { assertExists } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import {
  type EdgelessTool,
  LineWidth,
} from '../../../../../__internal__/index.js';
import { ArrowUpIcon, EdgelessPenIcon } from '../../../../../icons/index.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import { DEFAULT_BRUSH_COLOR } from '../../panel/color-panel.js';
import { getTooltipWithShortcut } from '../../utils.js';
import type { EdgelessBrushMenu } from './brush-menu.js';

interface BrushMenuPopper {
  element: EdgelessBrushMenu;
  dispose: () => void;
}

function createBrushMenuPopper(reference: HTMLElement): BrushMenuPopper {
  const brushMenu = document.createElement('edgeless-brush-menu');
  assertExists(reference.shadowRoot);
  reference.shadowRoot.appendChild(brushMenu);

  // The brush menu should be positioned at the top of the brush button.
  // And it should be positioned at the top center of the toolbar all the time.
  const x = 90;
  const y = -44;

  Object.assign(brushMenu.style, {
    left: `${x}px`,
    top: `${y}px`,
  });

  return {
    element: brushMenu,
    dispose: () => {
      brushMenu.remove();
    },
  };
}

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
    #edgeless-pen-icon {
      position: absolute;
      top: 10px;
      left: 3px;
      transition: top 0.3s ease-in-out;
    }
    .active-mode {
      height: 66px;
      width: 40px;
      top: 10px;
      position: absolute;
      border-top-left-radius: 30px;
      border-top-right-radius: 30px;
      background: var(--affine-hover-color);
    }
    #edgeless-pen-icon:hover {
      top: 2px;
    }
    .arrow-up-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      right: 2px;
      top: 12px;
      width: 14px;
      height: 14px;
      fill: var(--affine-icon-color);
    }
    .arrow-up-icon:hover {
      background: var(--affine-hover-color);
    }
  `;

  @property({ attribute: false })
  edgelessTool!: EdgelessTool;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  setEdgelessTool!: (edgelessTool: EdgelessTool) => void;

  @query('.brush-head-rect')
  private _brushHeadRect!: SVGElement;

  @query('.brush-midline-rect')
  private _brushMidlineRect!: SVGElement;

  @query('.brush-midline-stroke')
  private _brushMidlineStroke!: SVGElement;

  private _brushMenu: BrushMenuPopper | null = null;

  private _toggleBrushMenu() {
    if (this._brushMenu) {
      this._brushMenu.dispose();
      this._brushMenu = null;
    } else {
      this._brushMenu = createBrushMenuPopper(this);
      this._brushMenu.element.edgelessTool = this.edgelessTool;
      this._brushMenu.element.edgeless = this.edgeless;
    }
  }

  private _setBrushColor(color: string) {
    this._brushHeadRect.style.fill = `var(${color})`;
    this._brushMidlineRect.style.fill = `var(${color})`;
    this._brushMidlineStroke.style.stroke = `var(${color})`;
  }

  private _tryLoadBrushStateLocalColor(): string | null {
    const key = 'blocksuite:' + this.edgeless.page.id + ':edgelessBrush';
    const brushData = sessionStorage.getItem(key);
    let color = null;
    if (brushData) {
      color = JSON.parse(brushData).color;
    }
    return color;
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
      let color = this._tryLoadBrushStateLocalColor();
      if (!color) {
        color = DEFAULT_BRUSH_COLOR;
      }
      this._setBrushColor(color);
    });
    this._disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(newTool => {
        if (newTool.type === 'brush') {
          this._setBrushColor(newTool.color);
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
          ${EdgelessPenIcon}
          <div class="arrow-up-icon">${ArrowUpIcon}</div>
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
