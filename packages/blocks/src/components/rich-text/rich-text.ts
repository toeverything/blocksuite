import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import {
  createVirgoKeyDownHandler,
  VEditor,
  type VRange,
  type VRangeProvider,
} from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import * as Y from 'yjs';

import { tryFormatInlineStyle } from './markdown/inline.js';
import { onVBeforeinput, onVCompositionEnd } from './virgo/hooks.js';
import {
  type AffineTextAttributes,
  type AffineTextSchema,
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
    return this._virgoContainer;
  }

  @property({ attribute: false })
  yText!: Y.Text;

  @property({ attribute: false })
  textSchema!: AffineTextSchema;

  @property({ attribute: false })
  readonly = false;

  @property({ attribute: false })
  vRangeProvider?: VRangeProvider;
  @property({ attribute: false })
  undoManager!: Y.UndoManager;

  private _vEditor: AffineVEditor | null = null;
  get vEditor() {
    return this._vEditor;
  }

  private _lastScrollLeft = 0;

  private _init() {
    if (this._vEditor) {
      throw new Error('vEditor already exists.');
    }

    this._vEditor = new VEditor<AffineTextAttributes>(this.yText, {
      isEmbed: delta => !!delta.attributes?.reference,
      hooks: {
        beforeinput: onVBeforeinput,
        compositionEnd: onVCompositionEnd,
      },
      vRangeProvider: this.vRangeProvider,
    });
    this._vEditor.setAttributeSchema(this.textSchema.attributesSchema);
    this._vEditor.setAttributeRenderer(this.textSchema.textRenderer());

    assertExists(this._vEditor);
    const vEditor = this._vEditor;
    const keyDownHandler = createVirgoKeyDownHandler(this._vEditor, {
      inputRule: {
        key: ' ',
        handler: context => tryFormatInlineStyle(context, this.undoManager),
      },
    });

    assertExists(this.virgoContainer);
    vEditor.disposables.addFromEvent(
      this.virgoContainer,
      'keydown',
      keyDownHandler
    );

    vEditor.disposables.add(
      vEditor.slots.vRangeUpdated.on(([vRange]) => {
        if (!vRange) return;

        vEditor.waitForUpdate().then(() => {
          if (!vEditor.mounted) return;

          const range = vEditor.toDomRange(vRange);
          if (!range) return;

          this.scrollIntoView({
            block: 'nearest',
          });

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
    assertExists(this.textSchema, 'rich-text need textSchema to init.');

    // Rich-Text controls undo-redo itself if undoManager is not provided
    if (!this.undoManager) {
      this.undoManager = new Y.UndoManager(this.yText, {
        trackedOrigins: new Set([this.yText.doc.clientID]),
      });

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
