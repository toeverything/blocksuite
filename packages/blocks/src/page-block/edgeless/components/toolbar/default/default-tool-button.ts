import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { type EdgelessTool } from '../../../../../__internal__/index.js';
import {
  ArrowUpIcon,
  HandIcon,
  SelectIcon,
} from '../../../../../icons/index.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import { getTooltipWithShortcut } from '../../utils.js';

@customElement('edgeless-default-tool-button')
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
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  setEdgelessTool!: (edgelessTool: EdgelessTool) => void;

  @query('.current-icon')
  currentIcon!: HTMLInputElement;

  private _fadeOut() {
    this.currentIcon.style.opacity = '0';
    this.currentIcon.style.transform = `translateY(-5px)`;
  }

  private _fadeIn() {
    this.currentIcon.style.opacity = '1';
    this.currentIcon.style.transform = `translateY(0px)`;
  }

  private _changeTool() {
    const type = this.edgelessTool?.type;
    if (type !== 'default' && type !== 'pan') {
      this.setEdgelessTool({ type: 'default' });
      return;
    }
    this._fadeOut();
    // wait for animation to finish
    setTimeout(() => {
      if (type === 'default') {
        this.currentIcon;
        this.setEdgelessTool({ type: 'pan', panning: false });
      } else if (type === 'pan') {
        this.setEdgelessTool({ type: 'default' });
      }
      this._fadeIn();
    }, 100);
  }

  override render() {
    const type = this.edgelessTool?.type;
    const arrowColor =
      type === 'default' || type === 'pan' ? 'currentColor' : '#77757D';
    return html`
      <edgeless-tool-icon-button
        class="edgeless-default-button ${type}"
        .tooltip=${type === 'pan'
          ? getTooltipWithShortcut('Hand', 'H')
          : getTooltipWithShortcut('Select', 'V')}
        .active=${type === 'default' || type === 'pan'}
        .iconContainerPadding=${8}
        @click=${this._changeTool}
      >
        <span class="current-icon"
          >${type === 'pan' ? HandIcon : SelectIcon}</span
        >
        <span class="arrow-up-icon" style=${styleMap({ color: arrowColor })}>
          ${ArrowUpIcon}
        </span>
      </edgeless-tool-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-default-tool-button': EdgelessDefaultToolButton;
  }
}
