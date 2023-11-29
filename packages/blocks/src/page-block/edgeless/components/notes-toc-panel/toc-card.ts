import { noop } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { getThemeMode, on, once } from '../../../../_common/utils/index.js';
import { pickArray } from '../../../../_common/utils/iterable.js';
import type { NoteBlockModel } from '../../../../note-block/note-model.js';
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

export type DragEvent = CustomEvent<{
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
}>;

export type FitViewEvent = CustomEvent<{
  block: NoteBlockModel;
}>;

export class TOCNoteCard extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: block;
      position: relative;
      margin-top: 4px;
    }

    .card-container {
      position: relative;

      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
    }

    .card-preview {
      overflow: hidden;
      position: relative;

      width: 100%;
      height: 120px;
      padding: 0 8px;

      border-radius: 8px;
      background-color: var(--affine-background-primary-color);

      cursor: pointer;
      user-select: none;

      transition: border-color 0.2s ease-out;
    }

    .card-preview:hover {
      outline: 2px solid var(--affine-blue-500);
      background: var(--affine-hover-color);
    }

    .card-number-container {
      width: 100%;
      height: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card-number-container .card-number {
      text-align: center;
      font-size: 12px;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      color: var(--light-brand-color, #1e96eb);
      font-weight: 500;
      line-height: 14px;
      line-height: 20px;
    }

    .card-number-container .card-divider {
      height: 1px;
      width: calc(100% - 24px);
      border-top: 1px dashed var(--affine-border-color);
    }

    .card-content {
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      user-select: none;
    }

    .card-ellipsis {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 16px;
      gap: 10px;
      padding: 0 10px;
    }

    .card-ellipsis .dash {
      width: 60px;
      height: 1px;
      background-color: var(--affine-black-30);
      flex-grow: 1;
    }

    .card-ellipsis .dots {
      display: flex;
      padding: 5px 10px;
      border-radius: 8px;
      background: var(--affine-white, #fff);
      box-shadow: 0px 0px 1px 0px rgba(0, 0, 0, 0.15);
      gap: 2.5px;
    }

    .card-ellipsis .dots .dot {
      height: 3.5px;
      width: 3.5px;
      border-radius: 50%;
      background-color: var(--affine-icon-secondary);
    }

    .card-container.dragging {
      pointer-events: none;
      transform-origin: 16px 9px;
      position: fixed;
      top: 0;
      left: 0;
      contain: size layout paint;
      z-index: calc(var(--affine-z-index-popover, 0) + 3);
    }

    .card-container.placeholder {
      pointer-events: none;
      opacity: 0.5;
    }

    .card-container.selected .card-preview {
      background: var(--affine-hover-color);
    }

    .card-container.dragging .card-preview,
    .card-container.placeholder .card-preview {
      outline: 2px solid var(--affine-blue-500);
      background: linear-gradient(
          180deg,
          rgba(218, 233, 255, 0.2) 0%,
          rgba(255, 255, 255, 0) 100%
        ),
        #fff;
    }

    .dark.card-container.dragging .card-preview,
    .dark.card-container.placeholder .card-preview,
    .dark.card-container .card-preview:hover {
      background: linear-gradient(
          180deg,
          rgba(147, 146, 139, 0.2) 0%,
          rgba(255, 255, 255, 0) 100%
        ),
        #000;
    }

    .card-container[data-invisible='true'] .card-preview:hover,
    .card-container[data-invisible='true'] .card-preview {
      background: none;
      outline: none;
      box-shadow: none;
      border: 1px dashed var(--affine-border-color);
    }
    .card-container[data-invisible='true'] .card-wrapper {
      background: none;
    }
  `;

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  note!: NoteBlockModel;

  @property({ attribute: false })
  index!: number;

  @property({ attribute: false })
  number!: number;

  @property({ attribute: false })
  stackOrder!: number;

  @property({ attribute: false })
  pos!: { x: number; y: number };

  @property({ attribute: false })
  width?: number;

  @property({ attribute: false })
  status?: 'dragging' | 'selected' | 'placeholder';

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

      const event = new CustomEvent('drag', {
        detail: {
          clientX: e.clientX,
          clientY: e.clientY,
          pageX: e.pageX,
          pageY: e.pageY,
        },
      });

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

  override render() {
    if (this.note.isEmpty()) return nothing;

    const mode = getThemeMode();
    const { pos, stackOrder, width } = this;
    const { children } = this.note;
    const showEllipsis = children.length > 4;
    const [first, second] = pickArray(children, [0, 1]);
    const [secondToLast, last] = showEllipsis
      ? pickArray(children, [children.length - 2, children.length - 1])
      : [children[2], children[3]];

    return html`
      <div
        data-invisible="${this.invisible ? 'true' : 'false'}"
        class="card-container ${this.status ?? ''} ${mode}"
        style=${
          this.status === 'dragging'
            ? styleMap({
                transform: `translate(${pos.x - 16}px, ${pos.y - 9}px) rotate(${
                  stackOrder === 0 ? 3 : 1
                }deg)`,
                width: width ? `${width}px` : undefined,
              })
            : nothing
        }
      >
        <div
          class="card-preview"
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
            ${
              first
                ? html`<edgeless-toc-block-preview
                    .block=${first}
                  ></edgeless-toc-block-preview>`
                : nothing
            }
            ${
              second
                ? html`<edgeless-toc-block-preview
                    .block=${second}
                  ></edgeless-toc-block-preview>`
                : nothing
            }
            ${
              showEllipsis
                ? html`<div class="card-ellipsis">
                    <div class="dash"></div>
                    <div class="dots">
                      <div class="dot"></div>
                      <div class="dot"></div>
                      <div class="dot"></div>
                    </div>
                    <div class="dash"></div>
                  </div>`
                : null
            }
            ${
              secondToLast
                ? html`<edgeless-toc-block-preview
                    .block=${secondToLast}
                  ></edgeless-toc-block-preview>`
                : nothing
            }
            ${
              last
                ? html`<edgeless-toc-block-preview
                    .block=${last}
                  ></edgeless-toc-block-preview>`
                : nothing
            }
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-note-toc-card': TOCNoteCard;
  }
}
