import { type EditorHost } from '@blocksuite/block-std';
import { type AffineAIPanelWidgetConfig } from '@blocksuite/blocks';
import type { Doc } from '@blocksuite/store';
import { css, html, LitElement, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';

import { CustomPageEditorBlockSpecs } from '../utils/custom-specs.js';
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
    if (!this._previewDoc) return nothing;
    return html`
      <div class="ai-answer-text-container">
        <div class="ai-answer-text-editor affine-page-viewport">
          ${this.host.renderSpecPortal(
            this._previewDoc,
            CustomPageEditorBlockSpecs
          )}
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

export const createTextRenderer: (
  host: EditorHost
) => AffineAIPanelWidgetConfig['answerRenderer'] = host => {
  return answer => {
    return html`${keyed(
      answer,
      html`<ai-answer-text .host=${host} .answer=${answer}></ai-answer-text>`
    )}`;
  };
};
