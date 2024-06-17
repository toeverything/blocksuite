import { type EditorHost, WithDisposable } from '@blocksuite/block-std';
import type { AffineAIPanelState } from '@blocksuite/blocks';
import {
  type AffineAIPanelWidgetConfig,
  BlocksUtils,
  CodeBlockComponent,
  DividerBlockComponent,
  ListBlockComponent,
  ParagraphBlockComponent,
} from '@blocksuite/blocks';
import { type BlockSelector, BlockViewType, type Doc } from '@blocksuite/store';
import { css, html, LitElement, type PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { keyed } from 'lit/directives/keyed.js';

import { CustomPageEditorBlockSpecs } from '../utils/custom-specs.js';
import { markDownToDoc } from '../utils/markdown-utils.js';

const textBlockStyles = css`
  ${ParagraphBlockComponent.styles}
  ${ListBlockComponent.styles}
  ${DividerBlockComponent.styles}
  ${CodeBlockComponent.styles}
`;

const customHeadingStyles = css`
  .custom-heading {
    .h1 {
      font-size: calc(var(--affine-font-h-1) - 2px);
      code {
        font-size: calc(var(--affine-font-base) + 6px);
      }
    }
    .h2 {
      font-size: calc(var(--affine-font-h-2) - 2px);
      code {
        font-size: calc(var(--affine-font-base) + 4px);
      }
    }
    .h3 {
      font-size: calc(var(--affine-font-h-3) - 2px);
      code {
        font-size: calc(var(--affine-font-base) + 2px);
      }
    }
    .h4 {
      font-size: calc(var(--affine-font-h-4) - 2px);
      code {
        font-size: var(--affine-font-base);
      }
    }
    .h5 {
      font-size: calc(var(--affine-font-h-5) - 2px);
      code {
        font-size: calc(var(--affine-font-base) - 2px);
      }
    }
    .h6 {
      font-size: calc(var(--affine-font-h-6) - 2px);
      code {
        font-size: calc(var(--affine-font-base) - 4px);
      }
    }
  }
`;

type TextRendererOptions = {
  maxHeight?: number;
  customHeading?: boolean;
};

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
            margin-top: 0 !important;
          }
          > :last-child,
          > :last-child * {
            margin-bottom: 0 !important;
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

    .ai-answer-text-container {
      rich-text .nowrap-lines v-text span,
      rich-text .nowrap-lines v-element span {
        white-space: pre;
      }
      editor-host:focus-visible {
        outline: none;
      }
      editor-host * {
        box-sizing: border-box;
      }
    }

    ${textBlockStyles}
    ${customHeadingStyles}
  `;

  @query('.ai-answer-text-container')
  private accessor _container!: HTMLDivElement;

  private _doc!: Doc;

  private _answers: string[] = [];

  private _timer?: ReturnType<typeof setInterval> | null = null;

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor answer!: string;

  @property({ attribute: false })
  accessor options!: TextRendererOptions;

  @property({ attribute: false })
  accessor state: AffineAIPanelState | undefined = undefined;

  private _onWheel(e: MouseEvent) {
    e.stopPropagation();
    if (this.state === 'generating') {
      e.preventDefault();
    }
  }

  private _clearTimer = () => {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  };

  private _selector: BlockSelector = block =>
    BlocksUtils.matchFlavours(block.model, [
      'affine:page',
      'affine:note',
      'affine:surface',
      'affine:paragraph',
      'affine:code',
      'affine:list',
      'affine:divider',
    ])
      ? BlockViewType.Display
      : BlockViewType.Hidden;

  private _updateDoc = () => {
    if (this._answers.length > 0) {
      const latestAnswer = this._answers.pop();
      this._answers = [];
      if (latestAnswer) {
        markDownToDoc(this.host, latestAnswer)
          .then(doc => {
            this._doc = doc.blockCollection.getDoc({
              selector: this._selector,
            });
            this.disposables.add(() => {
              doc.blockCollection.clearSelector(this._selector);
            });
            this._doc.awarenessStore.setReadonly(
              this._doc.blockCollection,
              true
            );
            this.requestUpdate();
            if (this.state !== 'generating') {
              this._clearTimer();
            }
          })
          .catch(console.error);
      }
    }
  };

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

    this._updateDoc();
    if (this.state === 'generating') {
      this._timer = setInterval(this._updateDoc, 600);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._clearTimer();
  }

  override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    requestAnimationFrame(() => {
      if (!this._container) return;
      this._container.scrollTop = this._container.scrollHeight;
    });
  }

  override render() {
    const { maxHeight, customHeading } = this.options;
    const classes = classMap({
      'ai-answer-text-container': true,
      'show-scrollbar': !!maxHeight,
      'custom-heading': !!customHeading,
    });
    return html`
      <style>
        .ai-answer-text-container {
          max-height: ${maxHeight ? Math.max(maxHeight, 200) + 'px' : ''};
        }
      </style>
      <div class=${classes} @wheel=${this._onWheel}>
        ${keyed(
          this._doc,
          html`<div class="ai-answer-text-editor affine-page-viewport">
            ${this.host.renderSpecPortal(this._doc, CustomPageEditorBlockSpecs)}
          </div>`
        )}
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
  options: TextRendererOptions
) => AffineAIPanelWidgetConfig['answerRenderer'] = (host, options) => {
  return (answer, state) => {
    return html`<ai-answer-text
      .host=${host}
      .answer=${answer}
      .state=${state}
      .options=${options}
    ></ai-answer-text>`;
  };
};
