import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

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
      font-size: 14px;
      font-weight: bold;
    }

    .comment-panel-comment-author {
      font-size: 12px;
      color: var(--affine-text-secondary-color);
    }

    .comment-panel-comment-text {
      margin-top: 8px;
    }
  `;

  @property({ attribute: false })
  host!: EditorHost;

  commentManager: CommentManager | null = null;

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
        <sl-button>Add</sl-button>
        <sl-button>Close</sl-button>
      </div>
      <div class="comment-panel-comments">
        ${comments.map(
          comment =>
            html`<div class="comment-panel-comment">
              <div class="comment-panel-comment-quote">
                ${comment.content.quote}
              </div>
              <div class="comment-panel-comment-author">
                ${comment.content.author}
              </div>
              <div class="comment-panel-comment-text">
                ${comment.content.text}
              </div>
            </div>`
        )}
      </div>
    </div>`;
  }

  private _addComment() {
    const textSelection = this.host.selection.find('text');
    if (!textSelection) return;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'comment-panel': CommentPanel;
  }
}
