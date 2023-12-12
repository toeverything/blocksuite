import { assertExists } from '@blocksuite/global/utils';
import {
  type AttributeRenderer,
  createInlineKeyDownHandler,
  InlineEditor,
  type InlineRange,
  type InlineRangeProvider,
} from '@blocksuite/inline';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Y } from '@blocksuite/store';
import { Text, Workspace } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { z } from 'zod';

import { onVBeforeinput, onVCompositionEnd } from './inline/hooks.js';
import {
  type AffineInlineEditor,
  type AffineTextAttributes,
} from './inline/types.js';
import { tryFormatInlineStyle } from './markdown/inline.js';

interface RichTextStackItem {
  meta: Map<'richtext-v-range', InlineRange | null>;
  type: 'undo' | 'redo';
}

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
  private _inlineEditorContainer!: HTMLDivElement;
  get inlineEditorContainer() {
    assertExists(this._inlineEditorContainer);
    return this._inlineEditorContainer;
  }

  @property({ attribute: false })
  yText!: Y.Text | Text;

  @property({ attribute: false })
  attributesSchema?: z.ZodSchema;
  @property({ attribute: false })
  attributeRenderer?: AttributeRenderer;

  @property({ attribute: false })
  readonly = false;

  @property({ attribute: false })
  inlineRangeProvider?: InlineRangeProvider;
  // rich-text will create a undoManager if it is not provided.
  @property({ attribute: false })
  undoManager!: Y.UndoManager;

  // If it is true rich-test will prevent events related to clipboard bubbling up and handle them by itself.
  @property({ attribute: false })
  enableClipboard = true;
  // If it is true rich-text will handle undo/redo by itself. (including v-range restore)
  // It will listen ctrl+z/ctrl+shift+z and call undoManager.undo/redo, keydown event will not
  // bubble up if pressed ctrl+z/ctrl+shift+z.
  @property({ attribute: false })
  enableUndoRedo = true;
  @property({ attribute: false })
  enableAutoScrollVertically = true;
  @property({ attribute: false })
  enableAutoScrollHorizontally = true;
  @property({ attribute: false })
  enableMarkdownShortcut = true;

  // `enableMarkdownShortcut` will be overwritten to false and
  // `attributesSchema` will be overwritten to `z.object({})` if `enableFormat` is false.
  @property({ attribute: false })
  enableFormat = true;

  private _inlineEditor: AffineInlineEditor | null = null;
  get inlineEditor() {
    return this._inlineEditor;
  }

  private _lastScrollLeft = 0;

  private _init() {
    if (this._inlineEditor) {
      throw new Error('Inline editor already exists.');
    }

    if (!this.enableFormat) {
      this.enableMarkdownShortcut = false;
      this.attributesSchema = z.object({});
    }

    // init inline editor
    this._inlineEditor = new InlineEditor<AffineTextAttributes>(this._yText, {
      isEmbed: delta => !!delta.attributes?.reference,
      hooks: {
        beforeinput: onVBeforeinput,
        compositionEnd: onVCompositionEnd,
      },
      inlineRangeProvider: this.inlineRangeProvider,
    });
    if (this.attributesSchema) {
      this._inlineEditor.setAttributeSchema(this.attributesSchema);
    }
    if (this.attributeRenderer) {
      this._inlineEditor.setAttributeRenderer(this.attributeRenderer);
    }
    const inlineEditor = this._inlineEditor;

    if (this.enableMarkdownShortcut) {
      const keyDownHandler = createInlineKeyDownHandler(inlineEditor, {
        inputRule: {
          key: [' ', 'Enter'],
          handler: context => tryFormatInlineStyle(context, this.undoManager),
        },
      });

      inlineEditor.disposables.addFromEvent(
        this.inlineEditorContainer,
        'keydown',
        keyDownHandler
      );
    }

    // init auto scroll
    inlineEditor.disposables.add(
      inlineEditor.slots.inlineRangeUpdated.on(([inlineRange, sync]) => {
        if (!inlineRange || !sync) return;

        inlineEditor.waitForUpdate().then(() => {
          if (!inlineEditor.mounted) return;

          // get newest inline range
          const inlineRange = inlineEditor.getInlineRange();
          if (!inlineRange) return;

          const range = inlineEditor.toDomRange(inlineRange);
          if (!range) return;

          // scroll container is window
          if (this.enableAutoScrollVertically) {
            const rangeRect = range.getBoundingClientRect();

            if (rangeRect.top < 0) {
              this.scrollIntoView({ block: 'start' });
            } else if (rangeRect.bottom > window.innerHeight) {
              this.scrollIntoView({ block: 'end' });
            }
          }

          // scroll container is rich-text
          if (this.enableAutoScrollHorizontally) {
            // make sure the result of moveX is expected
            this.scrollLeft = 0;
            const thisRect = this.getBoundingClientRect();
            const rangeRect = range.getBoundingClientRect();
            let moveX = 0;
            if (
              rangeRect.left + rangeRect.width >
              thisRect.left + thisRect.width
            ) {
              moveX =
                rangeRect.left +
                rangeRect.width -
                (thisRect.left + thisRect.width);
              moveX = Math.max(this._lastScrollLeft, moveX);
            }

            this.scrollLeft = moveX;
          }
        });
      })
    );

    inlineEditor.mount(this.inlineEditorContainer);
    inlineEditor.setReadonly(this.readonly);
  }

  private _onStackItemAdded = (event: { stackItem: RichTextStackItem }) => {
    const inlineRange = this.inlineEditor?.getInlineRange();
    if (inlineRange) {
      event.stackItem.meta.set('richtext-v-range', inlineRange);
    }
  };

  private _onStackItemPopped = (event: { stackItem: RichTextStackItem }) => {
    const inlineRange = event.stackItem.meta.get('richtext-v-range');
    if (inlineRange && this.inlineEditor?.isValidInlineRange(inlineRange)) {
      this.inlineEditor?.setInlineRange(inlineRange);
    }
  };

  private _onCopy = (e: ClipboardEvent) => {
    const inlineEditor = this.inlineEditor;
    assertExists(inlineEditor);

    const inlineRange = inlineEditor.getInlineRange();
    if (!inlineRange) return;

    const text = inlineEditor.yTextString.slice(
      inlineRange.index,
      inlineRange.index + inlineRange.length
    );

    e.clipboardData?.setData('text/plain', text);
    e.preventDefault();
    e.stopPropagation();
  };

  private _onCut = (e: ClipboardEvent) => {
    const inlineEditor = this.inlineEditor;
    assertExists(inlineEditor);

    const inlineRange = inlineEditor.getInlineRange();
    if (!inlineRange) return;

    const text = inlineEditor.yTextString.slice(
      inlineRange.index,
      inlineRange.index + inlineRange.length
    );
    inlineEditor.deleteText(inlineRange);
    inlineEditor.setInlineRange({
      index: inlineRange.index,
      length: 0,
    });

    e.clipboardData?.setData('text/plain', text);
    e.preventDefault();
    e.stopPropagation();
  };

  private get _yText() {
    return this.yText instanceof Text ? this.yText.yText : this.yText;
  }

  private _onPaste = (e: ClipboardEvent) => {
    const inlineEditor = this.inlineEditor;
    assertExists(inlineEditor);

    const inlineRange = inlineEditor.getInlineRange();
    if (!inlineRange) return;

    const text = e.clipboardData?.getData('text/plain');
    if (!text) return;

    inlineEditor.insertText(inlineRange, text);
    inlineEditor.setInlineRange({
      index: inlineRange.index + text.length,
      length: 0,
    });

    e.preventDefault();
    e.stopPropagation();
  };

  private _unmount() {
    if (this.inlineEditor?.mounted) {
      this.inlineEditor.unmount();
    }
    this._inlineEditor = null;
  }

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await this.inlineEditor?.waitForUpdate();
    return result;
  }

  override connectedCallback() {
    super.connectedCallback();

    assertExists(this._yText, 'rich-text need yText to init.');
    assertExists(this._yText.doc, 'yText should be bind to yDoc.');

    if (!this.undoManager) {
      this.undoManager = new Workspace.Y.UndoManager(this._yText, {
        trackedOrigins: new Set([this._yText.doc.clientID]),
      });
    }

    if (this.enableUndoRedo) {
      this.disposables.addFromEvent(this, 'keydown', (e: KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey) {
          if (e.key === 'z') {
            if (e.shiftKey) {
              this.undoManager.redo();
            } else {
              this.undoManager.undo();
            }
            e.stopPropagation();
          }
        }
      });

      this.undoManager.on('stack-item-added', this._onStackItemAdded);
      this.undoManager.on('stack-item-popped', this._onStackItemPopped);
      this.disposables.add({
        dispose: () => {
          this.undoManager.off('stack-item-added', this._onStackItemAdded);
          this.undoManager.off('stack-item-popped', this._onStackItemPopped);
        },
      });
    }

    if (this.enableClipboard) {
      this.disposables.addFromEvent(this, 'copy', this._onCopy);
      this.disposables.addFromEvent(this, 'cut', this._onCut);
      this.disposables.addFromEvent(this, 'paste', this._onPaste);
    }

    this.updateComplete.then(() => {
      this._unmount();
      this._init();

      this.disposables.add({
        dispose: () => {
          this._unmount();
        },
      });
    });

    this.disposables.addFromEvent(this, 'scroll', () => {
      this._lastScrollLeft = this.scrollLeft;
    });
  }

  override updated() {
    if (this._inlineEditor) {
      this._inlineEditor.setReadonly(this.readonly);
    }
  }

  override render() {
    return html`<div class="affine-rich-text inline-editor"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rich-text': RichText;
  }
}
