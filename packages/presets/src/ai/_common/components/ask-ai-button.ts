import './ask-ai-panel.js';

import { type EditorHost, WithDisposable } from '@blocksuite/block-std';
import {
  type AIItemGroupConfig,
  AIStarIcon,
  createButtonPopper,
  EdgelessRootService,
} from '@blocksuite/blocks';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { getRootService } from '../../utils/selection-utils.js';

type buttonSize = 'small' | 'middle' | 'large';

const buttonWidthMap: Record<buttonSize, string> = {
  small: '70px',
  middle: '76px',
  large: '82px',
};

@customElement('ask-ai-button')
export class AskAIButton extends WithDisposable(LitElement) {
  static override styles = css`
    .ask-ai-button {
      border-radius: 4px;
    }

    .ask-ai-icon-button {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--affine-brand-color);
      font-size: var(--affine-font-sm);
      font-weight: 500;
      position: relative;
      gap: 4px;
    }

    .ask-ai-icon-button.small {
      font-size: var(--affine-font-xs);
      svg {
        scale: 0.8;
      }
    }

    .ask-ai-icon-button.large {
      font-size: var(--affine-font-md);
      svg {
        scale: 1.2;
      }
    }

    .ask-ai-icon-button span {
      line-height: 22px;
    }

    ask-ai-panel {
      display: none;
    }

    ask-ai-panel[data-show] {
      display: block;
    }

    .ask-ai-icon-button svg {
      color: var(--affine-brand-color);
    }
  `;

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor actionGroups!: AIItemGroupConfig[];

  @property({ attribute: false })
  accessor size: buttonSize = 'middle';

  @property({ attribute: false })
  accessor backgroundColor: string | undefined = undefined;

  @property({ attribute: false })
  accessor boxShadow: string | undefined = undefined;

  @query('.ask-ai-button')
  private accessor _askAIButton!: HTMLDivElement;
  @query('ask-ai-panel')
  private accessor _askAIPanel!: HTMLDivElement;
  private _askAIPopper: ReturnType<typeof createButtonPopper> | null = null;

  get _edgeless() {
    const rootService = getRootService(this.host);
    if (rootService instanceof EdgelessRootService) {
      return rootService;
    }
    return null;
  }

  override firstUpdated() {
    this._askAIPopper = createButtonPopper(
      this._askAIButton,
      this._askAIPanel,
      ({ display }) => {
        this._edgeless?.tool.setEdgelessTool({
          type: display === 'show' ? 'copilot' : 'default',
        });
      },
      10,
      120,
      () => {
        if (this._edgeless) {
          const { left: x, top: y, width, height } = this._edgeless.viewport;
          return { x, y, width, height: height - 100 };
        }
        return;
      }
    );
    this.disposables.add(this._askAIPopper);
    this.disposables.add(() => {
      this._edgeless?.tool.setEdgelessTool({ type: 'default' });
    });
  }

  override render() {
    const buttonStyles = styleMap({
      backgroundColor: this.backgroundColor || 'transparent',
      boxShadow: this.boxShadow || 'none',
    });
    return html`<div class="ask-ai-button" style=${buttonStyles}>
      <icon-button
        class="ask-ai-icon-button ${this.size}"
        width=${buttonWidthMap[this.size]}
        height="24px"
        @click=${() => this._askAIPopper?.toggle()}
      >
        ${AIStarIcon} <span>Ask AI</span></icon-button
      >
      <ask-ai-panel
        .host=${this.host}
        .actionGroups=${this.actionGroups}
      ></ask-ai-panel>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ask-ai-button': AskAIButton;
  }
}
