import {
  ArrowUpIcon,
  LassoFreeHandIcon,
  LassoPolygonalIcon,
} from '@blocksuite/affine-components/icons';
import { WithDisposable } from '@blocksuite/global/utils';
import { css, html, LitElement } from 'lit';
import { query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { LassoMode } from '../../../../../_common/types.js';
import { getTooltipWithShortcut } from '../../utils.js';
import { QuickToolMixin } from '../mixins/quick-tool.mixin.js';

export class EdgelessLassoToolButton extends QuickToolMixin(
  WithDisposable(LitElement)
) {
  static override styles = css`
    .current-icon {
      transition: 100ms;
      width: 24px;
      height: 24px;
    }
    .current-icon > svg {
      display: block;
    }
    .arrow-up-icon {
      position: absolute;
      top: 4px;
      right: 2px;
      font-size: 0;
    }
  `;

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

  override type = 'lasso' as const;

  private _fadeIn() {
    this.currentIcon.style.opacity = '1';
    this.currentIcon.style.transform = `translateY(0px)`;
  }

  private _fadeOut() {
    this.currentIcon.style.opacity = '0';
    this.currentIcon.style.transform = `translateY(-5px)`;
  }

  override connectedCallback(): void {
    super.connectedCallback();

    this.disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(tool => {
        if (tool.type === 'lasso') {
          const { mode } = tool;
          this.curMode = mode;
          // this.edgeless.service.editPropsStore.record(this.type, { mode });
        }
      })
    );
  }

  override render() {
    const type = this.edgelessTool?.type;
    const mode = this.curMode === LassoMode.FreeHand ? 'freehand' : 'polygonal';

    const arrowColor =
      type === 'lasso' ? 'currentColor' : 'var(--affine-icon-secondary)';
    return html`
      <edgeless-tool-icon-button
        class="edgeless-lasso-button ${mode}"
        .tooltip=${getTooltipWithShortcut('Lasso', 'L')}
        .tooltipOffset=${17}
        .active=${type === 'lasso'}
        .iconContainerPadding=${6}
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

  @state()
  accessor curMode: LassoMode = LassoMode.FreeHand;

  @query('.current-icon')
  accessor currentIcon!: HTMLInputElement;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-lasso-tool-button': EdgelessLassoToolButton;
  }
}
