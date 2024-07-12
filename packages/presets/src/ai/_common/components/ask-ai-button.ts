import { type EditorHost, WithDisposable } from '@blocksuite/block-std';
import {
  type AIItemGroupConfig,
  AIStarIcon,
  EdgelessRootService,
} from '@blocksuite/blocks';
import { HoverController } from '@blocksuite/blocks';
import { createLitPortal } from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import { flip, offset } from '@floating-ui/dom';
import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';

import { getRootService } from '../../utils/selection-utils.js';
import './ask-ai-panel.js';

type buttonSize = 'large' | 'middle' | 'small';
type toggleType = 'click' | 'hover';

const buttonWidthMap: Record<buttonSize, string> = {
  large: '82px',
  middle: '76px',
  small: '72px',
};

const buttonHeightMap: Record<buttonSize, string> = {
  large: '32px',
  middle: '32px',
  small: '24px',
};

export type AskAIButtonOptions = {
  backgroundColor?: string;
  boxShadow?: string;
  panelWidth?: number;
  size: buttonSize;
};

@customElement('ask-ai-button')
export class AskAIButton extends WithDisposable(LitElement) {
  static override styles = css`
    .ask-ai-button {
      border-radius: 4px;
      position: relative;
    }

    .ask-ai-icon-button {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--affine-brand-color);
      font-size: var(--affine-font-sm);
      font-weight: 500;
    }

    .ask-ai-icon-button.small {
      font-size: var(--affine-font-xs);
      svg {
        scale: 0.8;
        margin-right: 2px;
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

    .ask-ai-icon-button svg {
      margin-right: 4px;
      color: var(--affine-brand-color);
    }
  `;

  private _abortController: AbortController | null = null;

  private _clearAbortController = () => {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
  };

  private _toggleAIPanel = () => {
    if (this.toggleType !== 'click') {
      return;
    }

    if (this._abortController) {
      this._clearAbortController();
      return;
    }

    this._abortController = new AbortController();
    assertExists(this._askAIButton);
    const panelMinWidth = this.options.panelWidth || 330;
    createLitPortal({
      abortController: this._abortController,
      closeOnClickAway: true,
      computePosition: {
        autoUpdate: true,
        middleware: [flip(), offset(4)],
        placement: 'bottom-start',
        referenceElement: this._askAIButton,
      },
      container: this._askAIButton,
      template: html`<ask-ai-panel
        .host=${this.host}
        .actionGroups=${this.actionGroups}
        .minWidth=${panelMinWidth}
      ></ask-ai-panel>`,
    });
  };

  private _whenHover = new HoverController(
    this,
    ({ abortController }) => {
      return {
        computePosition: {
          autoUpdate: true,
          middleware: [flip(), offset(-40)],
          placement: 'top-start',
          referenceElement: this,
        },
        template: html`<ask-ai-panel
          .host=${this.host}
          .actionGroups=${this.actionGroups}
          .abortController=${abortController}
        ></ask-ai-panel>`,
      };
    },
    { allowMultiple: true }
  );

  get _edgeless() {
    const rootService = getRootService(this.host);
    if (rootService instanceof EdgelessRootService) {
      return rootService;
    }
    return null;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._clearAbortController();
  }

  override firstUpdated() {
    this.disposables.add(() => {
      this._edgeless?.tool.setEdgelessTool({ type: 'default' });
    });
  }

  override render() {
    const { backgroundColor, boxShadow, size = 'small' } = this.options;
    const { toggleType } = this;
    const buttonStyles = styleMap({
      backgroundColor: backgroundColor || 'transparent',
      boxShadow: boxShadow || 'none',
    });
    return html`<div
      class="ask-ai-button"
      style=${buttonStyles}
      ${toggleType === 'hover' ? ref(this._whenHover.setReference) : nothing}
      @click=${this._toggleAIPanel}
    >
      <icon-button
        class="ask-ai-icon-button ${size}"
        width=${buttonWidthMap[size]}
        height=${buttonHeightMap[size]}
      >
        ${AIStarIcon} <span>Ask AI</span></icon-button
      >
    </div>`;
  }

  @query('.ask-ai-button')
  private accessor _askAIButton!: HTMLDivElement;

  @property({ attribute: false })
  accessor actionGroups!: AIItemGroupConfig[];

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor options: AskAIButtonOptions = {
    backgroundColor: undefined,
    boxShadow: undefined,
    panelWidth: 330,
    size: 'middle',
  };

  @property({ attribute: false })
  accessor toggleType: toggleType = 'hover';
}

declare global {
  interface HTMLElementTagNameMap {
    'ask-ai-button': AskAIButton;
  }
}
