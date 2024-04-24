import { type EditorHost, WithDisposable } from '@blocksuite/block-std';
import type { AffineAIPanelState } from '@blocksuite/blocks';
import {
  type AffineAIPanelWidgetConfig,
  BlocksUtils,
} from '@blocksuite/blocks';
import type { BlockSelector, Doc } from '@blocksuite/store';
import { css, html, LitElement, nothing, type PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { keyed } from 'lit/directives/keyed.js';

import { CustomPageEditorBlockSpecs } from '../utils/custom-specs.js';
import { markDownToDoc } from '../utils/markdown-utils.js';

@customElement('ai-answer-text-preview')
export class AIAnswerTextPreview extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      width: 100%;
      display: flex;
    }

    .ai-answer-text-editor.affine-page-viewport {
      background: transparent;
      font-family: var(--affine-font-family);
      margin-top: 0;
      margin-bottom: 0;
    }

    .ai-answer-text-editor .affine-page-root-block-container {
      padding: 0;
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
            padding-top: 0;
          }
          > :last-child,
          > :last-child * {
            margin-bottom: 0;
            padding-bottom: 0;
          }
        }
      }
    }
  `;

  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  answer!: string;

  private _previewDoc: Doc | null = null;

  private _selector: BlockSelector = block =>
    BlocksUtils.matchFlavours(block.model, [
      'affine:page',
      'affine:note',
      'affine:surface',
      'affine:paragraph',
      'affine:code',
      'affine:list',
      'affine:divider',
    ]);

  override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (changedProperties.has('answer')) {
      markDownToDoc(this.host, this.answer)
        .then(doc => {
          this._previewDoc = doc.blockCollection.getDoc(this._selector);
          this.disposables.add(() => {
            doc.blockCollection.clearSelector(this._selector);
          });
          this._previewDoc.awarenessStore.setReadonly(
            this._previewDoc.blockCollection,
            true
          );
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
      <div class="ai-answer-text-editor affine-page-viewport">
        ${this.host.renderSpecPortal(
          this._previewDoc,
          CustomPageEditorBlockSpecs
        )}
      </div>
    `;
  }
}

@customElement('ai-answer-text')
export class AIAnswerText extends LitElement {
  static override styles = css`
    .ai-answer-text-container {
      overflow-y: auto;
      overflow-x: hidden;
      display: flex;
      padding: 0;
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

  override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (changedProperties.has('answer')) {
      requestAnimationFrame(() => {
        if (!this._container) return;
        this._container.scrollTop = this._container.scrollHeight;
      });
    }
  }

  override render() {
    if (!this.answer) return nothing;
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
        ${keyed(
          this.answer,
          html`<ai-answer-text-preview
            .host=${this.host}
            .answer=${this.answer}
          ></ai-answer-text-preview>`
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-answer-text': AIAnswerText;
    'ai-answer-text-preview': AIAnswerTextPreview;
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
