import { assertExists, type BaseBlockModel } from '@blocksuite/store';
import { VEditor } from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { type BlockHost, type CommonSlots } from '../utils/index.js';
import { NonShadowLitElement } from '../utils/lit.js';
import { setupVirgoScroll } from '../utils/virgo.js';
import { InlineSuggestionController } from './inline-suggestion.js';
import { createKeyboardBindings, createKeyDownHandler } from './keyboard.js';
import { type AffineTextSchema, type AffineVEditor } from './virgo/types.js';

const IGNORED_ATTRIBUTES = ['link', 'code', 'reference'] as const;

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
  host!: BlockHost<CommonSlots>;

  @property()
  model!: BaseBlockModel;

  @property()
  textSchema?: AffineTextSchema;

  private _vEditor: AffineVEditor | null = null;
  get vEditor() {
    return this._vEditor;
  }

  private _inlineSuggestController: InlineSuggestionController =
    new InlineSuggestionController(this);

  firstUpdated() {
    assertExists(this.model.text, 'rich-text need text to init.');
    this._vEditor = new VEditor(this.model.text.yText);
    setupVirgoScroll(this.model.page, this._vEditor);

    const textSchema = this.textSchema;
    assertExists(
      textSchema,
      'Failed to render rich-text! textSchema not found'
    );
    this._vEditor.setAttributeSchema(textSchema.attributesSchema);
    this._vEditor.setAttributeRenderer(textSchema.textRenderer(this.host));

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
        if (e.data && e.data !== '\n') {
          if (
            deltas.length > 1 ||
            (deltas.length === 1 && vRange.index !== 0)
          ) {
            const attributes = deltas[0][0].attributes;
            if (deltas.length !== 1 || vRange.index === vEditor.yText.length) {
              IGNORED_ATTRIBUTES.forEach(attr => {
                delete attributes?.[attr];
              });
            }

            vEditor.insertText(vRange, e.data, attributes);
            vEditor.setVRange({
              index: vRange.index + e.data.length,
              length: 0,
            });
            return true;
          }
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

        const deltas = vEditor.getDeltasByVRange(vRange);
        if (deltas.length > 0 && vRange.index >= 0 && data && data !== '\n') {
          const attributes = deltas[0][0].attributes;
          if (deltas.length !== 1 || vRange.index === vEditor.yText.length) {
            IGNORED_ATTRIBUTES.forEach(attr => {
              delete attributes?.[attr];
            });
          }

          vEditor.insertText(vRange, data, attributes);
          vEditor.setVRange({
            index: vRange.index + data.length,
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
