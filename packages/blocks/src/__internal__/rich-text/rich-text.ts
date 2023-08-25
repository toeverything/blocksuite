import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { BaseTextAttributes, VHandlerContext } from '@blocksuite/virgo';
import { createVirgoKeyDownHandler, VEditor } from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import type * as Y from 'yjs';

import { isStrictUrl } from '../utils/url.js';
import { tryFormatInlineStyle } from './markdown-convert.js';
import {
  type AffineTextAttributes,
  type AffineTextSchema,
  type AffineVEditor,
} from './virgo/types.js';

const EDGE_IGNORED_ATTRIBUTES = ['code', 'reference'] as const;
const GLOBAL_IGNORED_ATTRIBUTES = ['reference'] as const;

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
    const isUrl = isStrictUrl(newText);

    // If the new text with original link text is not pattern matched, we should reset the text
    if (!isUrl) {
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

  // In delete, context.data is null
  const insertText = context.data || '';
  const verifyData = `${line.textContent.slice(
    0,
    vRange.index
  )}${insertText}`.split(' ');

  const verifyStr = verifyData[verifyData.length - 1];

  const isUrl = isStrictUrl(verifyStr);

  if (!isUrl) {
    return;
  }
  const startIndex = vRange.index + insertText.length - verifyStr.length;

  editor.formatText(
    {
      index: startIndex,
      length: verifyStr.length,
    },
    {
      link: verifyStr,
    }
  );

  context.attributes = {
    ...context.attributes,
    link: verifyStr,
  };
};

@customElement('rich-text')
export class RichText extends WithDisposable(ShadowlessElement) {
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
  `;

  @query('.affine-rich-text')
  private _virgoContainer!: HTMLDivElement;
  get virgoContainer() {
    return this._virgoContainer;
  }

  @property({ attribute: false })
  yText!: Y.Text;

  @property({ attribute: false })
  undoManager!: Y.UndoManager;

  @property({ attribute: false })
  textSchema!: AffineTextSchema;

  @property({ attribute: false })
  readonly = false;

  private _vEditor: AffineVEditor | null = null;
  get vEditor() {
    return this._vEditor;
  }

  private _init() {
    if (this._vEditor) {
      throw new Error('vEditor already exists.');
    }

    this._vEditor = new VEditor<AffineTextAttributes>(this.yText, {
      isEmbed: delta => !!delta.attributes?.reference,
    });
    this._vEditor.setAttributeSchema(this.textSchema.attributesSchema);
    this._vEditor.setAttributeRenderer(this.textSchema.textRenderer());

    assertExists(this._vEditor);
    const keyDownHandler = createVirgoKeyDownHandler(this._vEditor, {
      inputRule: {
        key: ' ',
        handler: context => tryFormatInlineStyle(context, this.undoManager),
      },
    });

    assertExists(this.virgoContainer);
    this.virgoContainer.addEventListener('keydown', keyDownHandler);

    let ifPrefixSpace = false;

    this._vEditor.mount(this._virgoContainer);
    this._vEditor.bindHandlers({
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
            deltas.length > 1 || // cursor is in the between of two deltas
            (deltas.length === 1 && vRange.index !== 0) // cursor is in the end of line or in the middle of a delta
          ) {
            // each new text inserted by virgo will not contain any attributes,
            // but we want to keep the attributes of previous text or current text where the cursor is in
            // here are two cases:
            // 1. aaa**b|bb**ccc --input 'd'--> aaa**bdbb**ccc, d should extend the bold attribute
            // 2. aaa**bbb|**ccc --input 'd'--> aaa**bbbd**ccc, d should extend the bold attribute
            const { attributes } = deltas[0][0];
            if (deltas.length !== 1 || vRange.index === vEditor.yText.length) {
              // `EDGE_IGNORED_ATTRIBUTES` is which attributes should be ignored in case 2
              EDGE_IGNORED_ATTRIBUTES.forEach(attr => {
                delete attributes?.[attr];
              });
            }

            // `GLOBAL_IGNORED_ATTRIBUTES` is which attributes should be ignored in case 1, 2
            GLOBAL_IGNORED_ATTRIBUTES.forEach(attr => {
              delete attributes?.[attr];
            });

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
              EDGE_IGNORED_ATTRIBUTES.forEach(attr => {
                delete attributes?.[attr];
              });
            }

            GLOBAL_IGNORED_ATTRIBUTES.forEach(attr => {
              delete attributes?.[attr];
            });

            ctx.attributes = attributes ?? null;
          }
        }
        autoIdentifyLink(vEditor, ctx);

        return ctx;
      },
    });

    this._vEditor.setReadonly(this.readonly);
  }

  _unmount() {
    if (this.vEditor?.mounted) {
      this.vEditor.unmount();
    }
    this._vEditor = null;
  }

  override connectedCallback() {
    super.connectedCallback();

    assertExists(this.yText, 'rich-text need yText to init.');
    assertExists(this.undoManager, 'rich-text need undoManager to init.');
    assertExists(this.textSchema, 'rich-text need textSchema to init.');

    this.updateComplete.then(() => {
      this._unmount();
      this._init();

      this.disposables.add({
        dispose: () => {
          this._unmount();
        },
      });
    });
  }

  override updated() {
    if (this._vEditor) {
      this._vEditor.setReadonly(this.readonly);
    }
  }

  override render() {
    return html`<div class="affine-rich-text virgo-editor"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rich-text': RichText;
  }
}
