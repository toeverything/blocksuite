import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import {
  createVirgoKeyDownHandler,
  VEditor,
  type VRangeProvider,
} from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import type * as Y from 'yjs';

import { tryFormatInlineStyle } from './markdown-convert.js';
import { onVBeforeinput, onVCompositionEnd } from './virgo/hooks.js';
import {
  type AffineTextAttributes,
  type AffineTextSchema,
  type AffineVEditor,
} from './virgo/types.js';

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

  @property({ attribute: false })
  vRangeProvider?: VRangeProvider;

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
    vEditor.mount(this.virgoContainer);
    vEditor.setReadonly(this.readonly);
  }

  _unmount() {
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
