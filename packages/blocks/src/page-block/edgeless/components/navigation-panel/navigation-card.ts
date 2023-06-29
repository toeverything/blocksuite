import { ArrowIcon } from '@blocksuite/global/config';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { TopLevelBlockModel } from '../../../../__internal__/index.js';

export type ChangeIndexEvent = CustomEvent<{
  currentIndex: number;
  targetIndex: number;
  realIndex: number;
}>;

@customElement('edgeless-navigation-card')
export class NavigationCard extends LitElement {
  static override styles = css`
    .navigation-card-container {
      width: 259.147px;
      height: 135.722px;
      flex-shrink: 0;
    }

    .drag-area {
      border-radius: 8px;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0;
      padding: 9px 7px 7px 1px;
      background-color: rgba(0, 0, 0, 0);
      transition: background-color 0.2s ease-out;
      user-select: none;
    }

    .action {
      opacity: 0;
      position: relative;
      height: 100px;
      width: 17px;
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
      flex-grow: 1;
      box-sizing: border-box;
      width: 235px;
      height: 120px;
      border-radius: 8px;
      padding: 10px 12px;
      outline: 2px solid var(--affine-background-primary-color);
      background-color: var(--affine-background-primary-color);
      box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.05);
      transition: border-color 0.2s ease-out;
    }

    .card-index {
      box-sizing: border-box;
      display: flex;
      width: 20px;
      padding: 2px;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      border-radius: 8px;
      background: var(--light-affine-blue-affine-blue-600, #1e96eb);
    }

    .card-index > .text {
      text-align: center;
      font-size: 12px;
      font-family: var(--affine-font-family);
      color: var(--affine-white);
      font-weight: 600;
      line-height: 16px;
    }

    .card-content {
      font-family: var(--affine-font-family);
      user-select: text;
    }

    .card-ellipsis {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5.3px 0;
    }

    .card-ellipsis .dash {
      width: 60px;
      height: 1px;
      background-color: var(--affine-black-30);
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

    .navigation-card-container:hover .drag-area {
      background-color: var(--affine-hover-color, rgba(0, 0, 0, 0.04));
    }

    .navigation-card-container:hover .card-preview {
      outline: 2px solid var(--affine-blue-500);
    }
  `;

  @property({ attribute: false })
  note!: TopLevelBlockModel;

  @property({ attribute: false })
  realIdx!: number;

  @property({ attribute: false })
  idx!: number;

  private _dispatchChangeIdxEvent(newIndex: number) {
    const event = new CustomEvent('changeindex', {
      detail: {
        currentIndex: this.idx,
        targetIndex: newIndex,
        realIndex: this.realIdx,
      },
    });

    this.dispatchEvent(event);
  }

  private _moveForward() {
    if (this.idx > 1) {
      this._dispatchChangeIdxEvent(this.idx - 1);
    }
  }

  private _moveBackward() {
    this._dispatchChangeIdxEvent(this.idx + 1);
  }

  override render() {
    return html`
      <div class="navigation-card-container">
        <div class="drag-area">
          <div class="action">
            <div class="handle"></div>
            <span
              class="switch"
              role="button"
              style="top: 0; left:0;"
              @click=${this._moveForward}
              >${ArrowIcon}</span
            >
            <span
              class="switch"
              role="button"
              style="transform:rotate(0.5turn); bottom: 0; left: 0;"
              @click=${this._moveBackward}
              >${ArrowIcon}</span
            >
          </div>
          <div class="card-preview">
            <div class="card-index">
              <span class="text">${this.idx}</span>
            </div>
            <div class="card-content">
              <div style="font-size: 12px; font-weight: 600;">
                Controlling Playground Data Source
              </div>
              <div style="font-size: 10px; font-weight: 600;">
                You own your data, in spite of the cloud
              </div>
              <div class="card-ellipsis">
                <div class="dash"></div>
                <div class="dots">
                  <div class="dot"></div>
                  <div class="dot"></div>
                  <div class="dot"></div>
                </div>
                <div class="dash"></div>
              </div>
              <div style="font-size: 8px">
                device. As we run more and more of our lives and work through
                these cloud apps, they become more and
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-navigation-card': NavigationCard;
  }
}
