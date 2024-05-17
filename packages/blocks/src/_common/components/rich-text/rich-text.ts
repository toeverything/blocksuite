import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import {
  type AttributeRenderer,
  createInlineKeyDownHandler,
  type DeltaInsert,
  InlineEditor,
  type InlineRange,
  type InlineRangeProvider,
  type KeyboardBindingContext,
} from '@blocksuite/inline';
import type { Y } from '@blocksuite/store';
import { DocCollection, Text } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { z } from 'zod';

import type {
  AffineInlineEditor,
  AffineTextAttributes,
} from '../../inline/presets/affine-inline-specs.js';
import { onVBeforeinput, onVCompositionEnd } from './hooks.js';

interface RichTextStackItem {
  meta: Map<'richtext-v-range', InlineRange | null>;
}

@customElement('rich-text')
export class RichText extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    rich-text {
      display: block;
      height: 100%;
      width: 100%;
    }

    .inline-editor {
      height: 100%;
      width: 100%;
      outline: none;
      cursor: text;
    }

    .inline-editor.readonly {
      cursor: default;
    }

    rich-text .nowrap-lines {
      overflow-x: auto;
    }

    rich-text v-line {
      scroll-margin-top: 50px;
      scroll-margin-bottom: 30px;
    }

    rich-text .nowrap-lines v-text span,
    rich-text .nowrap-lines v-element span {
      white-space: pre !important;
    }
  `;

  @query('.inline-editor')
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
  inlineEventSource?: HTMLElement;

  @property({ attribute: false })
  markdownShortcutHandler?: <
    TextAttributes extends AffineTextAttributes = AffineTextAttributes,
  >(
    context: KeyboardBindingContext<TextAttributes>,
    undoManager: Y.UndoManager
  ) => boolean;

  @property({ attribute: false })
  embedChecker: <
    TextAttributes extends AffineTextAttributes = AffineTextAttributes,
  >(
    delta: DeltaInsert<TextAttributes>
  ) => boolean = () => false;

  @property({ attribute: false })
  readonly = false;

  @property({ attribute: false })
  inlineRangeProvider?: InlineRangeProvider;
  // rich-text will create a undoManager if it is not provided.
  @property({ attribute: false })
  undoManager!: Y.UndoManager;

  // If it is true rich-text will prevent events related to clipboard bubbling up and handle them by itself.
  @property({ attribute: false })
  enableClipboard = true;
  // If it is true rich-text will handle undo/redo by itself. (including v-range restore)
  // It will listen ctrl+z/ctrl+shift+z and call undoManager.undo/redo, keydown event will not
  // bubble up if pressed ctrl+z/ctrl+shift+z.
  @property({ attribute: false })
  enableUndoRedo = true;
  @property({ attribute: false })
  enableAutoScrollHorizontally = true;
  @property({ attribute: false })
  wrapText = true;

  // `attributesSchema` will be overwritten to `z.object({})` if `enableFormat` is false.
  @property({ attribute: false })
  enableFormat = true;

  @property({ attribute: false })
  verticalScrollContainer?: HTMLElement;

  private _inlineEditor: AffineInlineEditor | null = null;
  get inlineEditor() {
    return this._inlineEditor;
  }

  private _init() {
    if (this._inlineEditor) {
      throw new Error('Inline editor already exists.');
    }

    if (!this.enableFormat) {
      this.attributesSchema = z.object({});
    }

    // init inline editor
    this._inlineEditor = new InlineEditor<AffineTextAttributes>(this._yText, {
      isEmbed: delta => this.embedChecker(delta),
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

    const markdownShortcutHandler = this.markdownShortcutHandler;
    if (markdownShortcutHandler) {
      const keyDownHandler = createInlineKeyDownHandler(inlineEditor, {
        inputRule: {
          key: [' ', 'Enter'],
          handler: context =>
            markdownShortcutHandler(context, this.undoManager),
        },
      });

      inlineEditor.disposables.addFromEvent(
        this.inlineEventSource ?? this.inlineEditorContainer,
        'keydown',
        keyDownHandler
      );
    }

    // init auto scroll
    inlineEditor.disposables.add(
      inlineEditor.slots.inlineRangeUpdate.on(([inlineRange, sync]) => {
        if (!inlineRange || !sync) return;

        inlineEditor
          .waitForUpdate()
          .then(() => {
            if (!inlineEditor.mounted) return;

            const range = inlineEditor.toDomRange(inlineRange);
            if (!range) return;

            if (this.verticalScrollContainer) {
              const containerRect =
                this.verticalScrollContainer.getBoundingClientRect();
              const rangeRect = range.getBoundingClientRect();

              if (rangeRect.top < containerRect.top) {
                this.scrollIntoView({ block: 'start' });
              } else if (rangeRect.bottom > containerRect.bottom) {
                this.scrollIntoView({ block: 'end' });
              }
            }

            // scroll container is `inlineEditorContainer`
            if (this.enableAutoScrollHorizontally) {
              const containerRect =
                this.inlineEditorContainer.getBoundingClientRect();
              const rangeRect = range.getBoundingClientRect();

              let scrollLeft = this.inlineEditorContainer.scrollLeft;
              if (
                rangeRect.left + rangeRect.width >
                containerRect.left + containerRect.width
              ) {
                scrollLeft +=
                  rangeRect.left +
                  rangeRect.width -
                  (containerRect.left + containerRect.width) +
                  2;
              }
              this.inlineEditorContainer.scrollLeft = scrollLeft;
            }
          })
          .catch(console.error);
      })
    );

    inlineEditor.mount(
      this.inlineEditorContainer,
      this.inlineEventSource,
      this.readonly
    );
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

    const text = e.clipboardData
      ?.getData('text/plain')
      ?.replace(/\r?\n|\r/g, '\n');
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
      this.undoManager = new DocCollection.Y.UndoManager(this._yText, {
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

    this.updateComplete
      .then(() => {
        this._unmount();
        this._init();

        this.disposables.add({
          dispose: () => {
            this._unmount();
          },
        });
      })
      .catch(console.error);
  }

  override updated(changedProperties: Map<string | number | symbol, unknown>) {
    if (this._inlineEditor && changedProperties.has('readonly')) {
      this._inlineEditor.setReadonly(this.readonly);
    }
  }

  override render() {
    const classes = classMap({
      'inline-editor': true,
      'nowrap-lines': !this.wrapText,
      readonly: this.readonly,
    });

    return html`<div
      contenteditable=${this.readonly ? 'false' : 'true'}
      class=${classes}
    ></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rich-text': RichText;
  }
}
