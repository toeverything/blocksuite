import { noop } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { ArrowIcon, HiddenIcon } from '../../../../_common/icons/index.js';
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
    }

    .card-container {
      position: relative;

      height: 136px;
      padding: 9px 11px 7px;
      box-sizing: border-box;
    }

    .card-wrapper {
      position: absolute;
      top: 0px;
      left: -8px;

      display: flex;
      align-items: center;

      box-sizing: border-box;
      width: calc(100% + 4px);
      height: 100%;

      border-radius: 8px;
      background-color: rgba(0, 0, 0, 0);
      transition: background-color 0.2s ease-out;
      user-select: none;
    }

    .action {
      flex-grow: 1;
      opacity: 0;
      position: relative;
      height: 100px;
      width: 16px;
      transition: opacity 0.2s ease-out;
    }

    .action:hover {
      opacity: 1;
    }

    .action > .handle {
      position: absolute;
      left: 0;
      top: 16px;
      width: 17px;
      height: 68px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
    }

    .action > .handle::after {
      content: '';
      width: 2px;
      height: 21px;
      border-radius: 1px;
      transition: height 0.2s 0.5s ease-out;
      background-color: var(--affine-icon-secondary);
    }

    .action > .switch {
      color: var(--affine-icon-secondary);
      position: absolute;
      display: block;
      transition: opacity 0.2s 0.5s ease-out;
      cursor: pointer;
    }

    .handle:hover::after {
      height: 51px;
    }
    .handle:hover ~ .switch {
      pointer-events: none;
      opacity: 0;
    }

    .card-preview {
      overflow: hidden;
      position: relative;

      box-sizing: border-box;
      height: 120px;
      padding: 7px 12px;

      border-radius: 8px;
      outline: 2px solid var(--affine-background-primary-color);
      background-color: var(--affine-background-primary-color);
      box-shadow: 0px 0px 12px 0px rgba(66, 65, 73, 0.18);

      cursor: default;
      user-select: none;

      transition: border-color 0.2s ease-out;
    }

    .card-preview:hover {
      outline: 2px solid var(--affine-blue-500);
      background: linear-gradient(
          180deg,
          rgba(218, 233, 255, 0.2) 0%,
          rgba(255, 255, 255, 0) 100%
        ),
        #fff;
    }

    .card-number {
      box-sizing: border-box;
      display: flex;
      width: 20px;
      height: 20px;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      border-radius: 4px;
      background: var(--affine-blue-600);
      color: var(--affine-white);
    }

    .card-number > .number {
      text-align: center;
      font-size: 12px;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      font-weight: 600;
      line-height: 16px;
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

    .card-container:hover .card-wrapper {
      background-color: var(--affine-hover-color, rgba(0, 0, 0, 0.04));
    }

    .card-container.placeholder {
      pointer-events: none;
      opacity: 0.5;
    }

    .card-container[data-invisible='true'] .action {
      visibility: hidden;
    }

    .card-container.dragging .card-preview,
    .card-container.placeholder .card-preview,
    .card-container.selected .card-preview {
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
    .dark.card-container.selected .card-preview,
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

  private _dispatchReorderEvent(newNumber: number) {
    const event = new CustomEvent('reorder', {
      detail: {
        currentNumber: this.number,
        targetNumber: newNumber,
        index: this.index,
      },
    });

    this.dispatchEvent(event);
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

  private _moveForward() {
    if (this.number > 1) {
      this._dispatchReorderEvent(this.number - 1);
    }
  }

  private _moveBackward() {
    this._dispatchReorderEvent(this.number + 1);
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
        <div class="card-wrapper">
          <div class="action">
            <div
              class="handle"
              @mousedown=${this._dispatchDragEvent}
            ></div>
            <span
              class="switch"
              role="button"
              style="top: 0; left:0;"
              @click=${this._moveForward}
            >${ArrowIcon}</span>
            <span
              class="switch"
              role="button"
              style="transform:rotate(0.5turn); bottom: 0; left: 0;"
              @click=${this._moveBackward}
            >${ArrowIcon}</span
            >
          </div>
        </div>
        <div
          class="card-preview"
          @mousedown=${this._dispatchDragEvent}
          @click=${this._dispatchSelectEvent}
          @dblclick=${this._dispatchFitViewEvent}
        >
          <div class="card-number">
            ${
              this.invisible
                ? HiddenIcon
                : html`<span class="number">${this.number}</span>`
            }
          </div>
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
