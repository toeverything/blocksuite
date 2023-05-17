import { ShadowlessElement } from '@blocksuite/lit';
import { assertExists, type BaseBlockModel } from '@blocksuite/store';
import type { BaseTextAttributes, VHandlerContext } from '@blocksuite/virgo';
import { VEditor } from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { activeEditorManager } from '../utils/active-editor-manager.js';
import { setupVirgoScroll } from '../utils/virgo.js';
import { InlineSuggestionController } from './inline-suggestion.js';
import { createKeyboardBindings, createKeyDownHandler } from './keyboard.js';
import { type AffineTextSchema, type AffineVEditor } from './virgo/types.js';

const IGNORED_ATTRIBUTES = ['code', 'reference'] as const;

const autoIdentifyLink = (
  editor: AffineVEditor,
  context: VHandlerContext<BaseTextAttributes, InputEvent>
) => {
  const vRange = editor.getVRange();
  if (!vRange) return;
  if (context.attributes?.link && context.data === ' ') {
    delete context.attributes['link'];
    return;
  }

  const linkPattern =
    /(https?:\/\/|www\.)\S+\.(com|cn|org|net|edu|gov|info|io)(\/\S*)?$/;

  if (context.attributes?.link) {
    const linkDeltaInfo = editor.deltaService
      .getDeltasByVRange(vRange)
      .filter(([delta]) => delta.attributes?.link)[0];
    const [delta, { index, length }] = linkDeltaInfo;
    const rangePositionInDelta = vRange.index - index;

    const newText =
      delta.insert.slice(0, rangePositionInDelta) +
      context.data +
      delta.insert.slice(rangePositionInDelta);
    const match = linkPattern.exec(newText);
    if (!match) {
      editor.resetText({ index, length });
      delete context.attributes['link'];
      return;
    }

    return;
  }

  const [line] = editor.getLine(vRange.index);
  const prefixText = line.textContent.slice(0, vRange.index);
  const match = linkPattern.exec(prefixText + context.data);
  if (!match) {
    return;
  }
  const linkText = match[0];
  const startIndex = vRange.index - linkText.length;

  editor.formatText(
    {
      index: startIndex,
      length: linkText.length,
    },
    {
      link: linkText,
    }
  );

  context.attributes = {
    ...context.attributes,
    link: linkText,
  };
};

@customElement('rich-text')
export class RichText extends ShadowlessElement {
  static override styles = css`
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
  model!: BaseBlockModel;

  @property()
  textSchema?: AffineTextSchema;

  private _vEditor: AffineVEditor | null = null;
  get vEditor() {
    return this._vEditor;
  }

  private _inlineSuggestController: InlineSuggestionController =
    new InlineSuggestionController(this);

  override firstUpdated() {
    assertExists(this.model.text, 'rich-text need text to init.');
    this._vEditor = new VEditor(this.model.text.yText, {
      active: () => activeEditorManager.isActive(this),
    });
    setupVirgoScroll(this.model.page, this._vEditor);
    const textSchema = this.textSchema;
    assertExists(
      textSchema,
      'Failed to render rich-text! textSchema not found'
    );
    this._vEditor.setAttributeSchema(textSchema.attributesSchema);
    this._vEditor.setAttributeRenderer(textSchema.textRenderer());

    const keyboardBindings = createKeyboardBindings(this.model, this._vEditor);
    const keyDownHandler = createKeyDownHandler(
      this._vEditor,
      keyboardBindings
    );

    let ifPrefixSpace = false;

    this._vEditor.mount(this._virgoContainer);
    this._vEditor.bindHandlers({
      keydown: keyDownHandler,
      virgoInput: ctx => {
        const vEditor = this._vEditor;
        assertExists(vEditor);
        const vRange = vEditor.getVRange();
        if (!vRange || vRange.length !== 0) {
          return ctx;
        }

        const { data, event } = ctx;
        const deltas = vEditor.getDeltasByVRange(vRange);

        // Overwrite the default behavior (Insert period when consecutive spaces) of IME.
        if (event.inputType === 'insertText' && data === ' ') {
          ifPrefixSpace = true;
        } else if (data !== '. ' && data !== '。 ') {
          ifPrefixSpace = false;
        }
        if (ifPrefixSpace && (data === '. ' || data === '。 ')) {
          ctx.data = ' ';
        }

        if (data && data.length > 0 && data !== '\n') {
          if (
            deltas.length > 1 ||
            (deltas.length === 1 && vRange.index !== 0)
          ) {
            const { attributes } = deltas[0][0];
            if (deltas.length !== 1 || vRange.index === vEditor.yText.length) {
              IGNORED_ATTRIBUTES.forEach(attr => {
                delete attributes?.[attr];
              });
            }

            ctx.attributes = attributes ?? null;
          }
        }
        autoIdentifyLink(vEditor, ctx);

        return ctx;
      },
      virgoCompositionEnd: ctx => {
        const vEditor = this._vEditor;
        assertExists(vEditor);
        const vRange = vEditor.getVRange();
        if (!vRange || vRange.length !== 0) {
          return ctx;
        }

        const { data } = ctx;
        const deltas = vEditor.getDeltasByVRange(vRange);
        if (data && data.length > 0 && data !== '\n') {
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

            ctx.attributes = attributes ?? null;
          }
        }
        // autoIdentifyLink(vEditor, ctx);

        return ctx;
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

  override updated() {
    if (this._vEditor) {
      this._vEditor.setReadonly(this.model.page.readonly);
    }
  }

  override render() {
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
