import './ask-ai-panel.js';

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
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';

import { getRootService } from '../../utils/selection-utils.js';

type buttonSize = 'small' | 'middle' | 'large';

const buttonWidthMap: Record<buttonSize, string> = {
  small: '72px',
  middle: '76px',
  large: '82px',
};

const buttonHeightMap: Record<buttonSize, string> = {
  small: '24px',
  middle: '32px',
  large: '32px',
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
      gap: 2px;
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

    .ask-ai-icon-button svg {
      color: var(--affine-brand-color);
    }
  `;

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor actionGroups!: AIItemGroupConfig[];

  @property({ attribute: false })
  accessor toggleType!: 'hover' | 'click';

  @property({ attribute: false })
  accessor size: buttonSize = 'middle';

  @property({ attribute: false })
  accessor backgroundColor: string | undefined = undefined;

  @property({ attribute: false })
  accessor boxShadow: string | undefined = undefined;

  @query('.ask-ai-button')
  private accessor _askAIButton!: HTMLDivElement;

  private _abortController: AbortController | null = null;

  get _edgeless() {
    const rootService = getRootService(this.host);
    if (rootService instanceof EdgelessRootService) {
      return rootService;
    }
    return null;
  }

  private _whenHover = new HoverController(
    this,
    ({ abortController }) => {
      return {
        template: html`<ask-ai-panel
          .host=${this.host}
          .actionGroups=${this.actionGroups}
          .abortController=${abortController}
        ></ask-ai-panel>`,
        computePosition: {
          referenceElement: this,
          placement: 'top-start',
          middleware: [flip(), offset(-40)],
          autoUpdate: true,
        },
      };
    },
    { allowMultiple: true }
  );

  private _toggleAIPanel = () => {
    if (this.toggleType !== 'click') {
      return;
    }

    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
      return;
    }

    this._abortController = new AbortController();
    assertExists(this._askAIButton);
    createLitPortal({
      template: html`<ask-ai-panel
        .host=${this.host}
        .actionGroups=${this.actionGroups}
      ></ask-ai-panel>`,
      container: this._askAIButton,
      computePosition: {
        referenceElement: this._askAIButton,
        placement: 'bottom-start',
        middleware: [flip(), offset(4)],
        autoUpdate: true,
      },
      abortController: this._abortController,
      closeOnClickAway: true,
    });
  };

  override firstUpdated() {
    this.disposables.add(() => {
      this._edgeless?.tool.setEdgelessTool({ type: 'default' });
    });
  }

  override render() {
    const buttonStyles = styleMap({
      backgroundColor: this.backgroundColor || 'transparent',
      boxShadow: this.boxShadow || 'none',
    });
    return html`<div
      class="ask-ai-button"
      style=${buttonStyles}
      ${this.toggleType === 'hover'
        ? ref(this._whenHover.setReference)
        : nothing}
      @click=${this._toggleAIPanel}
    >
      <icon-button
        class="ask-ai-icon-button ${this.size}"
        width=${buttonWidthMap[this.size]}
        height=${buttonHeightMap[this.size]}
      >
        ${AIStarIcon} <span>Ask AI</span></icon-button
      >
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ask-ai-button': AskAIButton;
  }
}
