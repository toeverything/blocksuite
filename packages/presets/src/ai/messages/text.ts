import { type EditorHost, WithDisposable } from '@blocksuite/block-std';
import type { AffineAIPanelState } from '@blocksuite/blocks';
import { type AffineAIPanelWidgetConfig } from '@blocksuite/blocks';
import { type Doc } from '@blocksuite/store';
import { css, html, LitElement, type PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { CustomPageEditorBlockSpecs } from '../utils/custom-specs.js';
import { markDownToDoc } from '../utils/markdown-utils.js';

@customElement('ai-answer-text')
export class AIAnswerText extends WithDisposable(LitElement) {
  static override styles = css`
    .ai-answer-text-editor.affine-page-viewport {
      background: transparent;
      font-family: var(--affine-font-family);
      margin-top: 0;
      margin-bottom: 0;
    }

    .ai-answer-text-editor .affine-page-root-block-container {
      padding: 0;
      line-height: var(--affine-line-height);
      color: var(--affine-text-primary-color);
      font-weight: 400;
    }

    .affine-paragraph-block-container {
      line-height: 22px;
    }

    .ai-answer-text-editor {
      .affine-note-block-container {
        > .affine-block-children-container {
          > :first-child,
          > :first-child * {
            margin-top: 0;
          }
          > :last-child,
          > :last-child * {
            margin-bottom: 0;
          }
        }
      }
    }

    .ai-answer-text-container {
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0;
      overscroll-behavior-y: none;
    }
    .ai-answer-text-container.show-scrollbar::-webkit-scrollbar {
      width: 5px;
      height: 100px;
    }
    .ai-answer-text-container.show-scrollbar::-webkit-scrollbar-thumb {
      border-radius: 20px;
    }
    .ai-answer-text-container.show-scrollbar:hover::-webkit-scrollbar-thumb {
      background-color: var(--affine-black-30);
    }
    .ai-answer-text-container.show-scrollbar::-webkit-scrollbar-corner {
      display: none;
    }
  `;

  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  answer!: string;

  @property({ attribute: false })
  state?: AffineAIPanelState;

  @property({ attribute: false })
  maxHeight?: number;

  @query('.ai-answer-text-container')
  private _container!: HTMLDivElement;

  private _onWheel(e: MouseEvent) {
    e.stopPropagation();
    if (this.state === 'generating') {
      e.preventDefault();
    }
  }

  private _doc!: Doc;
  private _answers: string[] = [];
  private _timer?: ReturnType<typeof setInterval> | null = null;

  override shouldUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('answer')) {
      this._answers.push(this.answer);
      return false;
    }

    return true;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._answers.push(this.answer);
    const updateDoc = () => {
      if (this._answers.length > 0) {
        const latestAnswer = this._answers.pop();
        this._answers = [];
        if (latestAnswer) {
          markDownToDoc(this.host, latestAnswer)
            .then(doc => {
              this._doc = doc;
              this._doc.awarenessStore.setReadonly(
                this._doc.blockCollection,
                true
              );
              this.requestUpdate();
            })
            .catch(console.error);
        }
      }
    };

    updateDoc();

    this._timer = setInterval(updateDoc, 1000);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    requestAnimationFrame(() => {
      if (!this._container) return;
      this._container.scrollTop = this._container.scrollHeight;
    });
  }

  override render() {
    const classes = classMap({
      'ai-answer-text-container': true,
      'show-scrollbar': !!this.maxHeight,
    });
    return html`
      <style>
        .ai-answer-text-container {
          max-height: ${this.maxHeight
            ? Math.max(this.maxHeight, 200) + 'px'
            : ''};
        }
      </style>
      <div class=${classes} @wheel=${this._onWheel}>
        <div class="ai-answer-text-editor affine-page-viewport">
          ${this.host.renderSpecPortal(this._doc, CustomPageEditorBlockSpecs)}
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
  host: EditorHost,
  maxHeight?: number
) => AffineAIPanelWidgetConfig['answerRenderer'] = (host, maxHeight) => {
  return (answer, state) => {
    return html`<ai-answer-text
      .host=${host}
      .answer=${answer}
      .state=${state}
      .maxHeight=${maxHeight}
    ></ai-answer-text>`;
  };
};
