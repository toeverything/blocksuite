import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  ArrowUpIcon,
  LassoFreeHandIcon,
  LassoPolygonalIcon,
} from '../../../../../_common/icons/edgeless.js';
import { type EdgelessTool, LassoMode } from '../../../../../_common/types.js';
import type { EdgelessRootBlockComponent } from '../../../edgeless-root-block.js';
import { getTooltipWithShortcut } from '../../utils.js';

@customElement('edgeless-lasso-tool-button')
export class EdgelessDefaultToolButton extends WithDisposable(LitElement) {
  static override styles = css`
    .current-icon {
      transition: 100ms;
    }
    .arrow-up-icon {
      position: absolute;
      top: 4px;
      right: 2px;
      font-size: 0;
    }
  `;
  @property({ attribute: false })
  edgelessTool!: EdgelessTool;

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  setEdgelessTool!: (edgelessTool: EdgelessTool) => void;

  @query('.current-icon')
  currentIcon!: HTMLInputElement;

  @state()
  curMode: LassoMode = LassoMode.FreeHand;

  private _fadeOut() {
    this.currentIcon.style.opacity = '0';
    this.currentIcon.style.transform = `translateY(-5px)`;
  }

  private _fadeIn() {
    this.currentIcon.style.opacity = '1';
    this.currentIcon.style.transform = `translateY(0px)`;
  }
  override connectedCallback(): void {
    super.connectedCallback();

    this.disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(tool => {
        if (tool.type === 'lasso') {
          this.curMode = tool.mode;
        }
      })
    );
  }
  private _changeTool = () => {
    const tool = this.edgelessTool;
    if (tool.type !== 'lasso') {
      this.setEdgelessTool({ type: 'lasso', mode: this.curMode });
      return;
    }

    this._fadeOut();
    setTimeout(() => {
      this.curMode === LassoMode.FreeHand
        ? this.setEdgelessTool({ type: 'lasso', mode: LassoMode.Polygonal })
        : this.setEdgelessTool({ type: 'lasso', mode: LassoMode.FreeHand });
      this._fadeIn();
    }, 100);
  };

  override render() {
    const type = this.edgelessTool?.type;
    const mode = this.curMode === LassoMode.FreeHand ? 'freehand' : 'polygonal';

    const arrowColor = type === 'lasso' ? 'currentColor' : '#77757D';
    return html`
      <edgeless-tool-icon-button
        class="edgeless-lasso-button ${mode}"
        .tooltip=${getTooltipWithShortcut('Toggle Lasso', 'Shift + V')}
        .tooltipOffset=${17}
        .active=${type === 'lasso'}
        .iconContainerPadding=${8}
        @click=${this._changeTool}
      >
        <span class="current-icon">
          ${this.curMode === LassoMode.FreeHand
            ? LassoFreeHandIcon
            : LassoPolygonalIcon}
        </span>
        <span class="arrow-up-icon" style=${styleMap({ color: arrowColor })}>
          ${ArrowUpIcon}
        </span>
      </edgeless-tool-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-lasso-tool-button': EdgelessDefaultToolButton;
  }
}
