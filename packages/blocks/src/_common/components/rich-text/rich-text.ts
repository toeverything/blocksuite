import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Y } from '@blocksuite/store';
import { Workspace } from '@blocksuite/store';
import {
  type AttributeRenderer,
  createVirgoKeyDownHandler,
  VEditor,
  type VRange,
  type VRangeProvider,
} from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { z } from 'zod';

import { tryFormatInlineStyle } from './markdown/inline.js';
import { onVBeforeinput, onVCompositionEnd } from './virgo/hooks.js';
import {
  type AffineTextAttributes,
  type AffineVEditor,
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
  yText!: Y.Text;

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

  private _vEditor: AffineVEditor | null = null;
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
    this._vEditor = new VEditor<AffineTextAttributes>(this.yText, {
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
    const vEditor = this._vEditor;

    if (this.enableMarkdownShortcut) {
      const keyDownHandler = createVirgoKeyDownHandler(vEditor, {
        inputRule: {
          key: [' ', 'Enter'],
          handler: context => tryFormatInlineStyle(context, this.undoManager),
        },
      });

      vEditor.disposables.addFromEvent(
        this.virgoContainer,
        'keydown',
        keyDownHandler
      );
    }

    // init auto scroll
    vEditor.disposables.add(
      vEditor.slots.vRangeUpdated.on(([vRange, sync]) => {
        if (!vRange || !sync) return;

        vEditor.waitForUpdate().then(() => {
          if (!vEditor.mounted) return;

          // get newest vRange
          const vRange = vEditor.getVRange();
          if (!vRange) return;

          const range = vEditor.toDomRange(vRange);
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

    vEditor.mount(this.virgoContainer);
    vEditor.setReadonly(this.readonly);
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
    const vEditor = this.vEditor;
    assertExists(vEditor);

    const vRange = vEditor.getVRange();
    if (!vRange) return;

    const text = vEditor.yTextString.slice(
      vRange.index,
      vRange.index + vRange.length
    );

    e.clipboardData?.setData('text/plain', text);
    e.preventDefault();
    e.stopPropagation();
  };

  private _onCut = (e: ClipboardEvent) => {
    const vEditor = this.vEditor;
    assertExists(vEditor);

    const vRange = vEditor.getVRange();
    if (!vRange) return;

    const text = vEditor.yTextString.slice(
      vRange.index,
      vRange.index + vRange.length
    );
    vEditor.deleteText(vRange);
    vEditor.setVRange({
      index: vRange.index,
      length: 0,
    });

    e.clipboardData?.setData('text/plain', text);
    e.preventDefault();
    e.stopPropagation();
  };

  private _onPaste = (e: ClipboardEvent) => {
    const vEditor = this.vEditor;
    assertExists(vEditor);

    const vRange = vEditor.getVRange();
    if (!vRange) return;

    const text = e.clipboardData?.getData('text/plain');
    if (!text) return;

    vEditor.insertText(vRange, text);
    vEditor.setVRange({
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

    assertExists(this.yText, 'rich-text need yText to init.');
    assertExists(this.yText.doc, 'yText should be bind to yDoc.');

    if (!this.undoManager) {
      this.undoManager = new Workspace.Y.UndoManager(this.yText, {
        trackedOrigins: new Set([this.yText.doc.clientID]),
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
