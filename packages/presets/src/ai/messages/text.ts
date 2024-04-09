import { type EditorHost } from '@blocksuite/block-std';
import {
  type AffineAIPanelWidgetConfig,
  PageEditorBlockSpecs,
} from '@blocksuite/blocks';
import type { Doc } from '@blocksuite/store';
import { css, html, LitElement, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { markDownToDoc } from '../utils/markdown-utils.js';

@customElement('ai-answer-text')
export class AIAnswerText extends LitElement {
  static override styles = css`
    .ai-answer-text-container {
      max-height: 340px;
      width: 100%;
      display: flex;
      overflow-y: auto;
      overflow-x: hidden;
      user-select: none;
    }

    .ai-answer-text-editor.affine-page-viewport {
      background: transparent;
      font-family: var(--affine-font-family);
      margin-top: 0;
    }

    .ai-answer-text-editor .affine-page-root-block-container {
      padding: 0;
    }

    .ai-answer-text-container::-webkit-scrollbar {
      width: 5px;
      height: 100px;
    }
    .ai-answer-text-container::-webkit-scrollbar-thumb {
      border-radius: 20px;
    }
    .ai-answer-text-container:hover::-webkit-scrollbar-thumb {
      background-color: var(--affine-black-30);
    }
    .ai-answer-text-container::-webkit-scrollbar-corner {
      display: none;
    }
  `;

  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  answer!: string;

  private _previewDoc: Doc | null = null;

  override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (changedProperties.has('answer')) {
      markDownToDoc(this.host, this.answer)
        .then(doc => {
          this._previewDoc = doc;
          this._previewDoc.awarenessStore.setReadonly(this._previewDoc, true);
          this.requestUpdate();
        })
        .catch(console.error);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._previewDoc = null;
  }

  override render() {
    console.log('answer: ', this.answer);
    if (!this._previewDoc) return nothing;
    return html`
      <div class="ai-answer-text-container">
        <div class="ai-answer-text-editor affine-page-viewport">
          ${this.host.renderSpecPortal(this._previewDoc, PageEditorBlockSpecs)}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-answer-text': AIAnswerText;
  }
}

export const textRenderer: AffineAIPanelWidgetConfig['answerRenderer'] = (
  host: EditorHost,
  answer: string
) => {
  // Create a new component instance for each answer
  const element = document.createElement('ai-answer-text') as AIAnswerText;
  element.host = host;
  element.answer = answer;
  return html`${element}`;
};
