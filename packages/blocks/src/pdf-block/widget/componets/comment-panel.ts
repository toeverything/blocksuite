import { DisposableGroup } from '@blocksuite/global/utils';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import {
  requestConnectedFrame,
  stopPropagation,
} from '../../../_common/utils/event.js';

@customElement('annotation-comment-panel')
export class AnnotationCommentPanel extends LitElement {
  static override styles = css`
    .pdf-annotation-comment-panel {
      position: absolute;
      left: 0;
      top: 40px;

      box-sizing: border-box;
      padding: 8px;
      width: 200px;
      gap: 4px;

      border-radius: 8px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      z-index: var(--affine-z-index-popover);
    }
  `;

  @property({ attribute: false })
  position!: { x: number; y: number };

  @property({ attribute: false })
  onSubmit!: (content: string) => void;

  @property({ attribute: false })
  onCancel!: () => void;

  @query('textarea')
  private _textarea!: HTMLTextAreaElement;

  private _disposable = new DisposableGroup();

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._disposable.dispose();
  }

  override firstUpdated(): void {
    requestConnectedFrame(() => {
      this._disposable.addFromEvent(document, 'click', () => {
        this.remove();
      });
    }, this);
  }

  override render() {
    return html`
      <div class="pdf-annotation-comment-panel" @click=${stopPropagation}>
        <form>
          <textarea name="comment"></textarea>
          <button
            type="button"
            @click=${() => this.onSubmit(this._textarea.value)}
          >
            Submit
          </button>
        </form>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pdf-annotation-comment-panel': AnnotationCommentPanel;
  }
}
