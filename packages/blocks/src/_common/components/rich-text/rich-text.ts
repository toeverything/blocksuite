import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Y } from '@blocksuite/store';
import { Text, Workspace } from '@blocksuite/store';
import {
  type AttributeRenderer,
  createVirgoKeyDownHandler,
  InlineEditor,
  type VRange,
  type VRangeProvider,
} from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { z } from 'zod';

import { tryFormatInlineStyle } from './markdown/inline.js';
import { onVBeforeinput, onVCompositionEnd } from './virgo/hooks.js';
import {
  type AffineInlineEditor,
  type AffineTextAttributes,
} from './virgo/types.js';

interface RichTextStackItem {
  meta: Map<'richtext-v-range', VRange | null>;
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
  private _virgoContainer!: HTMLDivElement;
  get virgoContainer() {
    assertExists(this._virgoContainer);
    return this._virgoContainer;
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
  vRangeProvider?: VRangeProvider;
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

  private _vEditor: AffineInlineEditor | null = null;
  get vEditor() {
    return this._vEditor;
  }

  private _lastScrollLeft = 0;

  private _init() {
    if (this._vEditor) {
      throw new Error('vEditor already exists.');
    }

    if (!this.enableFormat) {
      this.enableMarkdownShortcut = false;
      this.attributesSchema = z.object({});
    }

    // init vEditor
    this._vEditor = new InlineEditor<AffineTextAttributes>(this._yText, {
      isEmbed: delta => !!delta.attributes?.reference,
      hooks: {
        beforeinput: onVBeforeinput,
        compositionEnd: onVCompositionEnd,
      },
      vRangeProvider: this.vRangeProvider,
    });
    if (this.attributesSchema) {
      this._vEditor.setAttributeSchema(this.attributesSchema);
    }
    if (this.attributeRenderer) {
      this._vEditor.setAttributeRenderer(this.attributeRenderer);
    }
    const inlineEditor = this._vEditor;

    if (this.enableMarkdownShortcut) {
      const keyDownHandler = createVirgoKeyDownHandler(inlineEditor, {
        inputRule: {
          key: [' ', 'Enter'],
          handler: context => tryFormatInlineStyle(context, this.undoManager),
        },
      });

      inlineEditor.disposables.addFromEvent(
        this.virgoContainer,
        'keydown',
        keyDownHandler
      );
    }

    // init auto scroll
    inlineEditor.disposables.add(
      inlineEditor.slots.vRangeUpdated.on(([vRange, sync]) => {
        if (!vRange || !sync) return;

        inlineEditor.waitForUpdate().then(() => {
          if (!inlineEditor.mounted) return;

          // get newest vRange
          const vRange = inlineEditor.getVRange();
          if (!vRange) return;

          const range = inlineEditor.toDomRange(vRange);
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

    inlineEditor.mount(this.virgoContainer);
    inlineEditor.setReadonly(this.readonly);
  }

  private _onStackItemAdded = (event: { stackItem: RichTextStackItem }) => {
    const vRange = this.vEditor?.getVRange();
    if (vRange) {
      event.stackItem.meta.set('richtext-v-range', vRange);
    }
  };

  private _onStackItemPopped = (event: { stackItem: RichTextStackItem }) => {
    const vRange = event.stackItem.meta.get('richtext-v-range');
    if (vRange && this.vEditor?.isVRangeValid(vRange)) {
      this.vEditor?.setVRange(vRange);
    }
  };

  private _onCopy = (e: ClipboardEvent) => {
    const inlineEditor = this.vEditor;
    assertExists(inlineEditor);

    const vRange = inlineEditor.getVRange();
    if (!vRange) return;

    const text = inlineEditor.yTextString.slice(
      vRange.index,
      vRange.index + vRange.length
    );

    e.clipboardData?.setData('text/plain', text);
    e.preventDefault();
    e.stopPropagation();
  };

  private _onCut = (e: ClipboardEvent) => {
    const inlineEditor = this.vEditor;
    assertExists(inlineEditor);

    const vRange = inlineEditor.getVRange();
    if (!vRange) return;

    const text = inlineEditor.yTextString.slice(
      vRange.index,
      vRange.index + vRange.length
    );
    inlineEditor.deleteText(vRange);
    inlineEditor.setVRange({
      index: vRange.index,
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
    const inlineEditor = this.vEditor;
    assertExists(inlineEditor);

    const vRange = inlineEditor.getVRange();
    if (!vRange) return;

    const text = e.clipboardData?.getData('text/plain');
    if (!text) return;

    inlineEditor.insertText(vRange, text);
    inlineEditor.setVRange({
      index: vRange.index + text.length,
      length: 0,
    });

    e.preventDefault();
    e.stopPropagation();
  };

  private _unmount() {
    if (this.vEditor?.mounted) {
      this.vEditor.unmount();
    }
    this._vEditor = null;
  }

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await this.vEditor?.waitForUpdate();
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
