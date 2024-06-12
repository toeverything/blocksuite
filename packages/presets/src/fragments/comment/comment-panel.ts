import type { EditorHost } from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { CommentInput } from './comment-input.js';
import { CommentManager } from './comment-manager.js';

@customElement('comment-panel')
export class CommentPanel extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    comment-panel {
      position: absolute;
      top: 0;
      right: 0;
      border: 1px solid var(--affine-border-color, #e3e2e4);
      background-color: var(--affine-background-primary-color);
      height: 100vh;
      width: 320px;
      box-sizing: border-box;
      padding-top: 16px;
    }

    .comment-panel-container {
      width: 100%;
      height: 100%;
      padding: 16px;
    }

    .comment-panel-head {
      display: flex;
      gap: 8px;
    }

    .comment-panel-comments {
      margin-top: 16px;
    }

    .comment-panel-comment {
      margin-bottom: 16px;
    }

    .comment-panel-comment-quote {
      font-size: 10px;
      color: var(--affine-text-secondary-color);
      padding-left: 8px;
      border-left: 2px solid var(--affine-text-secondary-color);
      margin-bottom: 8px;
    }

    .comment-panel-comment-author {
      font-size: 12px;
    }

    .comment-panel-comment-text {
      margin-top: 8px;
    }
  `;

  @query('.comment-panel-container')
  private accessor _container!: HTMLDivElement;

  @property({ attribute: false })
  accessor host!: EditorHost;

  commentManager: CommentManager | null = null;

  private _addComment() {
    const textSelection = this.host.selection.find('text');
    if (!textSelection) return;

    const commentInput = new CommentInput();
    assertExists(this.commentManager);
    commentInput.manager = this.commentManager;
    commentInput.onSubmit = () => {
      this.requestUpdate();
    };
    this._container.append(commentInput);
  }

  override connectedCallback() {
    super.connectedCallback();

    assertExists(this.host);
    this.commentManager = new CommentManager(this.host);
  }

  override render() {
    assertExists(this.commentManager);
    const comments = this.commentManager.getComments();

    return html`<div class="comment-panel-container">
      <div class="comment-panel-head">
        <button @click=${this._addComment}>Add Comment</button>
      </div>
      <div class="comment-panel-comments">
        ${comments.map(comment => {
          return html`<div class="comment-panel-comment">
            <div class="comment-panel-comment-quote">${comment.quote}</div>
            <div class="comment-panel-comment-author">${comment.author}</div>
            <div class="comment-panel-comment-text">
              <rich-text .yText=${comment.text} .readonly=${true}></rich-text>
            </div>
          </div>`;
        })}
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'comment-panel': CommentPanel;
  }
}
