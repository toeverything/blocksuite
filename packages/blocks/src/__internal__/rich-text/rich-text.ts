import { assertExists, BaseBlockModel } from '@blocksuite/store';
import { VEditor } from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import type { BlockHost } from '../utils/index.js';
import { NonShadowLitElement } from '../utils/lit.js';
import { renderElement } from './virgo/render-element.js';

@customElement('rich-text')
export class RichText extends NonShadowLitElement {
  static styles = css`
    .affine-rich-text {
      height: 100%;
      width: 100%;
      outline: none;
      cursor: text;
    }

    .affine-rich-text code {
      font-family: 'SFMono-Regular', Menlo, Consolas, 'PT Mono',
        'Liberation Mono', Courier, monospace;
      line-height: normal;
      background: rgba(135, 131, 120, 0.15);
      color: #eb5757;
      border-radius: 3px;
      font-size: 85%;
      padding: 0.2em 0.4em;
    }
  `;

  @query('.affine-rich-text')
  private _virgoContainer!: HTMLDivElement;
  get virgoContainer() {
    return this._virgoContainer;
  }

  @property({ hasChanged: () => true })
  host!: BlockHost;

  @property()
  model!: BaseBlockModel;

  @property()
  placeholder?: string;

  @property({ hasChanged: () => true })
  modules: Record<string, unknown> = {};

  private _vEditor: VEditor | null = null;
  get vEditor() {
    return this._vEditor;
  }

  firstUpdated() {
    assertExists(this.model.text, 'rich-text need text to init.');
    this._vEditor = new VEditor(this.model.text.yText, {
      renderElement,
    });
    this._vEditor.mount(this._virgoContainer);
  }

  render() {
    return html`<div class="affine-rich-text virgo-editor"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rich-text': RichText;
  }
}
