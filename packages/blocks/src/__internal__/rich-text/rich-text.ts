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
  context: VHandlerContext<BaseTextAttributes, InputEvent | CompositionEvent>
) => {
  const vRange = editor.getVRange();
  if (!vRange) return;
  if (context.attributes?.link && context.data === ' ') {
    delete context.attributes['link'];
    return;
  }

  const linkPattern =
    /.*\.(com|cn|org|edu|net|gov|mil|info|biz|io|me)(\/\S*)?$/i;

  if (context.attributes?.link) {
    const linkDeltaInfo = editor.deltaService
      .getDeltasByVRange(vRange)
      .filter(([delta]) => delta.attributes?.link)[0];
    const [delta, { index, length }] = linkDeltaInfo;
    const rangePositionInDelta = vRange.index - index;

    //It means the link has been custom edited
    if (delta.attributes?.link !== delta.insert) {
      // If the cursor is at the end of the link, we should not auto identify it
      if (rangePositionInDelta === length) {
        delete context.attributes['link'];
        return;
      }
      // If the cursor is not at the end of the link, we should only update the link text
      return;
    }
    const newText =
      delta.insert.slice(0, rangePositionInDelta) +
      context.data +
      delta.insert.slice(rangePositionInDelta);
    const match = linkPattern.exec(newText);
    // If the new text with original link text is not pattern matched, we should reset the text
    if (!match) {
      editor.resetText({ index, length });
      delete context.attributes['link'];
      return;
    }
    // If the new text with original link text is pattern matched, we should update the link text
    editor.formatText(
      {
        index,
        length,
      },
      {
        link: newText,
      }
    );
    context.attributes = {
      ...context.attributes,
      link: newText,
    };
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
      keyboardBindings,
      this.model
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
        autoIdentifyLink(vEditor, ctx);

        return ctx;
      },
    });

    this._vEditor.setReadonly(this.model.page.readonly);
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
