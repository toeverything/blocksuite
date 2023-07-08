import type { SelectionManager } from '@blocksuite/block-std';
import type { BaseSelection } from '@blocksuite/block-std';
import type { TextSelection } from '@blocksuite/block-std';
import { ShadowlessElement } from '@blocksuite/lit';
import {
  assertExists,
  type BaseBlockModel,
  DisposableGroup,
} from '@blocksuite/store';
import type {
  BaseTextAttributes,
  VHandlerContext,
  VRangeUpdatedProp,
} from '@blocksuite/virgo';
import { VEditor } from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { activeEditorManager } from '../utils/active-editor-manager.js';
import { setupVirgoScroll } from '../utils/virgo.js';
import { createKeyboardBindings, createKeyDownHandler } from './keyboard.js';
import { REFERENCE_NODE } from './reference-node.js';
import { type AffineTextSchema, type AffineVEditor } from './virgo/types.js';

const IGNORED_ATTRIBUTES = ['code', 'reference'] as const;
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

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
    const isUrl = isValidUrl(newText);

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

  const isUrl = isValidUrl(verifyStr);

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

const autoIdentifyReference = (editor: AffineVEditor, text: string) => {
  // @AffineReference:(id)
  const referencePattern = /@AffineReference:\((.*)\)/g;

  const match = referencePattern.exec(text);
  if (!match) {
    return;
  }

  const pageId = match[1];

  editor.deleteText({
    index: 0,
    length: match[0].length,
  });
  editor.setVRange({
    index: 0,
    length: 0,
  });

  const vRange = {
    index: match[0].length,
    length: 0,
  };

  editor.insertText(vRange, REFERENCE_NODE, {
    reference: { type: 'Subpage', pageId },
  });
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
  `;

  @query('.affine-rich-text')
  private _virgoContainer!: HTMLDivElement;

  @property({ attribute: false })
  model!: BaseBlockModel;

  @property({ attribute: false })
  selection!: SelectionManager;

  @property({ attribute: false })
  textSchema?: AffineTextSchema;

  get virgoContainer() {
    return this._virgoContainer;
  }

  private _vEditor: AffineVEditor | null = null;
  private _disposables = new DisposableGroup();

  get vEditor() {
    return this._vEditor;
  }

  override connectedCallback() {
    super.connectedCallback();
    assertExists(this.model.text, 'Rich text need text to init');
    this._vEditor = new VEditor(this.model.text.yText, {
      active: () => activeEditorManager.isActive(this),
    });
    setupVirgoScroll(this, this._vEditor);
    const textSchema = this.textSchema;
    assertExists(
      textSchema,
      'Failed to render rich-text! textSchema not found'
    );
    this._vEditor.setAttributeSchema(textSchema.attributesSchema);
    this._vEditor.setAttributeRenderer(textSchema.textRenderer());
    autoIdentifyReference(this._vEditor, this.model.text.yText.toString());

    const vRangeUpdated = this._vEditor.slots.vRangeUpdated;
    this._disposables.add(vRangeUpdated.on(this._onRangeUpdated));
    this._disposables.add(this.selection.subscribe(this._onSelectionChanged));
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    const selections = this._removeCurrentSelection();
    this.selection.setSelections(selections, false);

    this._vEditor?.unmount();
    this._disposables.dispose();
  }

  private _removeCurrentSelection = () => {
    return this.selection.selections.filter(selection => {
      const toBeRemoved =
        selection.type === 'text' && selection.blockId === this.model.id;
      return !toBeRemoved;
    });
  };

  private _onRangeUpdated = ([range]: VRangeUpdatedProp) => {
    const selections = this._removeCurrentSelection();

    if (range) {
      const instance = this.selection.getInstance('text', {
        blockId: this.model.id,
        index: range.index,
        length: range.length,
      });
      selections.push(instance);
    }

    this.selection.setSelections(selections, false);
  };

  private _onSelectionChanged = async (selections: BaseSelection[]) => {
    if (!this._vEditor) {
      return;
    }

    const selection = selections.find(
      (selection): selection is TextSelection => {
        return selection.type === 'text' && selection.blockId === this.model.id;
      }
    );

    if (!selection) {
      return;
    }

    const vRange = {
      index: selection.index,
      length: selection.length,
    };

    await this.vEditor?.waitForUpdate();

    this._vEditor.setVRange(vRange);
    const range = this._vEditor.toDomRange(vRange);

    if (!range) {
      return;
    }

    this.selection.rangeController.add(range);
  };

  private _bindVirgoEvents() {
    assertExists(this._vEditor, 'virgo editor is not initialized.');
    const keyboardBindings = createKeyboardBindings(this.model, this._vEditor);
    const keyDownHandler = createKeyDownHandler(
      this._vEditor,
      keyboardBindings,
      this.model
    );

    let ifPrefixSpace = false;
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
  }

  override firstUpdated() {
    assertExists(this._vEditor, 'virgo editor is not initialized.');

    this._vEditor.mount(this._virgoContainer);
    this._bindVirgoEvents();

    this._vEditor.setReadonly(this.model.page.readonly);
  }

  override updated() {
    if (this._vEditor) {
      this._vEditor.setReadonly(this.model.page.readonly);
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
