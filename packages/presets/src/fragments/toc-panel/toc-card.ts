import {
  getThemeMode,
  type NoteBlockModel,
  on,
  once,
} from '@blocksuite/blocks';
import { noop } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';

import { TOCBlockPreview } from './toc-preview.js';

noop(TOCBlockPreview);

export type ReorderEvent = CustomEvent<{
  currentNumber: number;
  targetNumber: number;
  realIndex: number;
}>;

export type SelectEvent = CustomEvent<{
  id: string;
  selected: boolean;
  number: number;
  multiselect: boolean;
}>;

export type FitViewEvent = CustomEvent<{
  block: NoteBlockModel;
}>;

export type ClickBlockEvent = CustomEvent<{
  blockPath: string[];
}>;

export class TOCNoteCard extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: block;
      position: relative;
    }

    .card-container {
      position: relative;

      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      padding: 2px 0;
    }

    .card-preview {
      position: relative;

      width: 100%;

      border-radius: 4px;
      background-color: var(--affine-background-primary-color);

      cursor: default;
      user-select: none;
    }

    .card-preview.edgeless:hover {
      background: var(--affine-hover-color);
      cursor: pointer;
    }

    .card-number-container {
      padding: 0 8px;
      width: 100%;
      height: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-sizing: border-box;
    }

    .card-number-container .card-number {
      text-align: center;
      font-size: var(--affine-font-sm);
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      color: var(--light-brand-color, #1e96eb);
      font-weight: 500;
      line-height: 14px;
      line-height: 20px;
    }

    .card-number-container .card-divider {
      height: 1px;
      flex: 1;
      border-top: 1px dashed var(--affine-border-color);
      transform: translateY(50%);
    }

    .card-content {
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      user-select: none;
      color: var(--affine-text-primary-color);
    }

    .card-container.placeholder {
      pointer-events: none;
      opacity: 0.5;
    }

    .card-container.selected .card-preview {
      background: var(--affine-hover-color);
    }

    .card-container.placeholder .card-preview {
      background: var(--affine-hover-color);
      opacity: 0.9;
    }

    .card-container[data-invisible='true'] .card-number-container .card-number,
    .card-container[data-invisible='true'] .card-preview .card-content {
      color: var(--affine-text-disable-color);
      pointer-events: none;
    }

    .card-preview.page toc-block-preview:hover {
      color: var(--affine-blue-500);
    }
  `;

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  editorMode: 'page' | 'edgeless' = 'page';

  @property({ attribute: false })
  note!: NoteBlockModel;

  @property({ attribute: false })
  index!: number;

  @property({ attribute: false })
  number!: number;

  @property({ attribute: false })
  hidePreviewIcon!: boolean;

  @property({ attribute: false })
  status?: 'selected' | 'placeholder';

  @property({ attribute: false })
  invisible = false;

  @property({ attribute: false })
  showCardNumber = true;

  override connectedCallback(): void {
    super.connectedCallback();

    this._disposables.add(
      this.note.childrenUpdated.on(() => this.requestUpdate())
    );
    this._disposables.add(
      this.note.propsUpdated.on(() => this.requestUpdate())
    );

    const observer = new MutationObserver(() => this.requestUpdate());

    observer.observe(this.ownerDocument.documentElement, {
      subtree: false,
      childList: false,
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    this._disposables.add(() => observer.disconnect());
  }

  private _dispatchSelectEvent(e: MouseEvent) {
    const event = new CustomEvent('select', {
      detail: {
        id: this.note.id,
        selected: this.status !== 'selected',
        number: this.number,
        multiselect: e.shiftKey,
      },
    }) as SelectEvent;

    this.dispatchEvent(event);
  }

  private _dispatchDragEvent(e: MouseEvent) {
    e.preventDefault();
    if (e.button !== 0) return;

    const { clientX: startX, clientY: startY } = e;
    const disposeDragStart = on(this.ownerDocument, 'mousemove', e => {
      if (
        Math.abs(startX - e.clientX) < 5 &&
        Math.abs(startY - e.clientY) < 5
      ) {
        return;
      }
      if (this.status !== 'selected') {
        this._dispatchSelectEvent(e);
      }

      const event = new CustomEvent('drag');

      this.dispatchEvent(event);
      disposeDragStart();
    });

    once(this.ownerDocument, 'mouseup', () => {
      disposeDragStart();
    });
  }

  private _dispatchFitViewEvent(e: MouseEvent) {
    e.stopPropagation();

    const event = new CustomEvent('fitview', {
      detail: {
        block: this.note,
      },
    });

    this.dispatchEvent(event);
  }

  // Need to consider the case that block not a child of a note
  private _buildBlockPath(block: BaseBlockModel) {
    return [this.note.id, block.id];
  }

  private _dispatchClickBlockEvent(
    e: MouseEvent,
    invisible: boolean,
    block: BaseBlockModel
  ) {
    e.stopPropagation();
    if (invisible) return;

    const event = new CustomEvent('clickblock', {
      detail: {
        blockPath: this._buildBlockPath(block),
      },
    });

    this.dispatchEvent(event);
  }

  override render() {
    if (this.note.isEmpty()) return nothing;

    const mode = getThemeMode();
    const { children } = this.note;

    return html`
      <div
        data-invisible="${this.invisible ? 'true' : 'false'}"
        class="card-container ${this.status ?? ''} ${mode}"
      >
        <div
          class="card-preview ${this.editorMode}"
          @mousedown=${this._dispatchDragEvent}
          @click=${this._dispatchSelectEvent}
          @dblclick=${this._dispatchFitViewEvent}
        >
        ${
          this.showCardNumber
            ? html`<div class="card-number-container">
                <span class="card-number">${this.number}</span>
                <span class="card-divider"></span>
              </div>`
            : nothing
        }
          <div class="card-content">
            ${children.map(block => {
              return html`<toc-block-preview
                .block=${block}
                .hidePreviewIcon=${this.hidePreviewIcon}
                .disabledIcon=${this.invisible}
                @click=${(e: MouseEvent) =>
                  this._dispatchClickBlockEvent(e, this.invisible, block)}
              ></toc-block-preview>`;
            })}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'toc-note-card': TOCNoteCard;
  }
}
