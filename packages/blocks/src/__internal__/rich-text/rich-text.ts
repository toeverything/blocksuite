import { assertExists, type BaseBlockModel } from '@blocksuite/store';
import { VEditor } from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import type { Highlighter, Lang } from 'shiki';
import { z } from 'zod';

import { getCodeLineRenderer } from '../../code-block/utils/code-line-renderer.js';
import { type BlockHost } from '../utils/index.js';
import { NonShadowLitElement } from '../utils/lit.js';
import { setUpVirgoScroll } from '../utils/virgo.js';
import { InlineSuggestionController } from './inline-suggestion.js';
import { createKeyboardBindings, createKeyDownHandler } from './keyboard.js';
import { attributesRenderer } from './virgo/attributes-renderer.js';
import { affineTextAttributes, type AffineVEditor } from './virgo/types.js';

@customElement('rich-text')
export class RichText extends NonShadowLitElement {
  static styles = css`
    .affine-rich-text {
      height: 100%;
      width: 100%;
      outline: none;
      cursor: text;
    }

    v-line {
      scroll-margin-top: 50px;
      scroll-margin-bottom: 30px;
    }

    ${InlineSuggestionController.styles}
  `;

  @query('.affine-rich-text')
  private _virgoContainer!: HTMLDivElement;
  get virgoContainer() {
    return this._virgoContainer;
  }

  @property()
  host!: BlockHost;

  @property()
  model!: BaseBlockModel;

  @property()
  codeBlockGetHighlighterOptions?: () => {
    lang: Lang;
    highlighter: Highlighter | null;
  };

  private _vEditor: AffineVEditor | null = null;
  get vEditor() {
    return this._vEditor;
  }

  private _inlineSuggestController: InlineSuggestionController =
    new InlineSuggestionController(this);

  firstUpdated() {
    assertExists(this.model.text, 'rich-text need text to init.');
    this._vEditor = new VEditor(this.model.text.yText);
    setUpVirgoScroll(this.model.page, this._vEditor);
    if (this.codeBlockGetHighlighterOptions) {
      this._vEditor.setAttributesSchema(z.object({}));
      this._vEditor.setAttributesRenderer(
        getCodeLineRenderer(this.codeBlockGetHighlighterOptions)
      );
    } else {
      this._vEditor.setAttributesRenderer(attributesRenderer);
      this._vEditor.setAttributesSchema(affineTextAttributes);
    }

    const keyboardBindings = createKeyboardBindings(this.model, this._vEditor);
    const keyDownHandler = createKeyDownHandler(
      this._vEditor,
      keyboardBindings
    );

    this._vEditor.mount(this._virgoContainer);
    this._vEditor.bindHandlers({
      keydown: keyDownHandler,
      virgoInput: e => {
        const vEditor = this._vEditor;
        assertExists(vEditor);
        const vRange = vEditor.getVRange();
        if (!vRange || vRange.length !== 0) {
          return false;
        }

        const deltas = vEditor.getDeltasByVRange(vRange);
        if (
          deltas.length === 1 &&
          vRange.index !== 0 &&
          vRange.index !== vEditor.yText.length &&
          e.data &&
          e.data !== '\n'
        ) {
          const attributes = deltas[0][0].attributes;
          vEditor.insertText(vRange, e.data, attributes);
          vEditor.setVRange({
            index: vRange.index + 1,
            length: 0,
          });
          return true;
        }

        return false;
      },
      virgoCompositionEnd: e => {
        const { data } = e;
        const vEditor = this._vEditor;
        assertExists(vEditor);
        const vRange = vEditor.getVRange();
        if (!vRange || vRange.length !== 0) {
          return false;
        }

        const index = vRange.index;
        const deltas = vEditor.getDeltasByVRange(vRange);
        if (
          index >= 0 &&
          data &&
          data !== '\n' &&
          deltas.length === 1 &&
          vRange.index !== 0 &&
          vRange.index !== vEditor.yText.length
        ) {
          const attributes = deltas[0][0].attributes;
          vEditor.insertText(vRange, data, attributes);
          vEditor.setVRange({
            index: index + data.length,
            length: 0,
          });
          return true;
        }
        return false;
      },
    });

    this._vEditor.setReadonly(this.model.page.readonly);
    const inlineSuggestionProvider =
      this.model.page.workspace.inlineSuggestionProvider;
    if (inlineSuggestionProvider) {
      this._inlineSuggestController.init({
        provider: inlineSuggestionProvider,
        model: this.model,
        vEditor: this._vEditor,
      });
    }
  }

  updated() {
    if (this._vEditor) {
      this._vEditor.setReadonly(this.model.page.readonly);
    }
  }

  render() {
    return html`<div
        class="affine-rich-text virgo-editor"
        @keydown=${this._inlineSuggestController.onKeyDown}
        @focusin=${this._inlineSuggestController.onFocusIn}
        @focusout=${this._inlineSuggestController.onFocusOut}
      ></div>
      ${this._inlineSuggestController.render()}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rich-text': RichText;
  }
}
