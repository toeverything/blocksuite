import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

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
    edgeless-tool-icon-button > svg {
      position: absolute;
      top: 4px;
      right: 2px;
    }

    .current-icon {
      transition: 100ms;
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
    this._fadeOut();
    setTimeout(() => {
      const type = this.edgelessTool?.type;
      if (type === 'default') {
        this.currentIcon;
        this.setEdgelessTool({ type: 'pan', panning: false });
      } else {
        // 'pan' or other cases
        this.setEdgelessTool({ type: 'default' });
      }
      this._fadeIn();
    }, 100);
  }

  override render() {
    const type = this.edgelessTool?.type;
    return html`
      <edgeless-tool-icon-button
        class="edgeless-default-button"
        .tooltip=${type === 'pan'
          ? getTooltipWithShortcut('Hand', 'H')
          : getTooltipWithShortcut('Select', 'V')}
        .active=${type === 'default' || type === 'pan'}
        .iconContainerPadding=${8}
        @click=${this._changeTool}
      >
        <span class="current-icon"
          >${type === 'pan' ? HandIcon : SelectIcon}</span
        >${ArrowUpIcon}
      </edgeless-tool-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-default-tool-button': EdgelessDefaultToolButton;
  }
}
