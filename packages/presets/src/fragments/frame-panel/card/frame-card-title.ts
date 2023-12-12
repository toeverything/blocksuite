import { type FrameBlockModel, stopPropagation } from '@blocksuite/blocks';
import { DisposableGroup } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import type { Y } from '@blocksuite/store';
import { css, html, LitElement, type PropertyValues } from 'lit';
import { property, query } from 'lit/decorators.js';

import { FrameCardTitleEditor } from './frame-card-title-editor.js';

const styles = css`
  .frame-card-title-container {
    display: flex;
    white-space: nowrap;
    display: flex;
    justify-content: start;
    align-items: center;
    width: 100%;
    height: 20px;
    box-sizing: border-box;
    gap: 6px;
    font-size: var(--affine-font-sm);
    cursor: default;
    position: relative;
  }

  .frame-card-title-container .card-index {
    display: flex;
    align-self: center;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    box-sizing: border-box;
    border-radius: 2px;
    background: var(--affine-black);
    margin-left: 2px;

    color: var(--affine-white);
    text-align: center;
    font-weight: 500;
    line-height: 18px;
  }

  .frame-card-title-container .card-title {
    height: 20px;
    color: var(--affine-text-primary-color);
    font-weight: 400;
    line-height: 20px;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }
`;

export class FrameCardTitle extends WithDisposable(LitElement) {
  static override styles = styles;

  @property({ attribute: false })
  frame!: FrameBlockModel;

  @property({ attribute: false })
  cardIndex!: number;

  @query('.frame-card-title-container')
  titleContainer!: HTMLElement;

  @query('.frame-card-title-container .card-index')
  titleIndexElement!: HTMLElement;

  @query('.frame-card-title-container .card-title')
  titleContentElement!: HTMLElement;

  private _titleDisposables: DisposableGroup | null = null;

  private _updateElement = () => {
    this.requestUpdate();
  };

  private _mountTitleEditor = (e: MouseEvent) => {
    e.stopPropagation();

    const titleEditor = new FrameCardTitleEditor();
    titleEditor.frameModel = this.frame;
    titleEditor.titleContentElement = this.titleContentElement;
    const left = this.titleIndexElement.offsetWidth + 6;
    titleEditor.left = left;
    titleEditor.maxWidth = this.titleContainer.offsetWidth - left - 6;
    this.titleContainer.appendChild(titleEditor);
  };

  private _clearTitleDisposables = () => {
    this._titleDisposables?.dispose();
    this._titleDisposables = null;
  };

  private _setFrameDisposables(title: Y.Text) {
    this._clearTitleDisposables();
    title.observe(this._updateElement);
    this._titleDisposables = new DisposableGroup();
    this._titleDisposables.add({
      dispose: () => {
        title.unobserve(this._updateElement);
      },
    });
  }

  override updated(_changedProperties: PropertyValues) {
    if (_changedProperties.has('frame')) {
      this._setFrameDisposables(this.frame.title.yText);
    }
  }

  override connectedCallback() {
    super.connectedCallback();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._clearTitleDisposables();
  }

  override render() {
    return html`<div class="frame-card-title-container">
      <div
        class="card-index"
        @click=${stopPropagation}
        @dblclick=${stopPropagation}
      >
        ${this.cardIndex + 1}
      </div>
      <div class="card-title">
        <span @click=${stopPropagation} @dblclick=${this._mountTitleEditor}
          >${this.frame.title}</span
        >
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'frame-card-title': FrameCardTitle;
  }
}
