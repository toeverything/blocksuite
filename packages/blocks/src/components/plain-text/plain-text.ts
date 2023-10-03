import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { Workspace, type Y } from '@blocksuite/store';
import { VEditor, type VRange, type VRangeProvider } from '@blocksuite/virgo';
import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { z } from 'zod';

interface PlainTextStackItem {
  meta: Map<'plaintext-v-range', VRange | null>;
  type: 'undo' | 'redo';
}

@customElement('plain-text')
export class PlainText extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  yText!: Y.Text;

  @property({ attribute: false })
  readonly = false;

  @property({ attribute: false })
  vRangeProvider?: VRangeProvider;
  @property({ attribute: false })
  undoManager!: Y.UndoManager;

  @query('.virgo-container')
  private _virgoContainer?: HTMLDivElement;
  get virgoContainer() {
    return this._virgoContainer;
  }

  private _vEditor: VEditor | null = null;
  get vEditor() {
    return this._vEditor;
  }

  private _lastScrollLeft = 0;

  private _init() {
    if (this._vEditor) {
      throw new Error('vEditor already exists.');
    }

    this._vEditor = new VEditor(this.yText, {
      vRangeProvider: this.vRangeProvider,
    });
    this._vEditor.setAttributeSchema(z.object({}));

    assertExists(this._vEditor);
    const vEditor = this._vEditor;
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

    assertExists(this.virgoContainer);
    vEditor.mount(this.virgoContainer);
    vEditor.setReadonly(this.readonly);
  }

  private _onStackItemAdded = (event: { stackItem: PlainTextStackItem }) => {
    const vRange = this.vEditor?.getVRange();
    if (vRange) {
      event.stackItem.meta.set('plaintext-v-range', vRange);
    }
  };

  private _onStackItemPopped = (event: { stackItem: PlainTextStackItem }) => {
    const vRange = event.stackItem.meta.get('plaintext-v-range');
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

    assertExists(this.yText, 'plain-text need yText to init.');
    assertExists(this.yText.doc, 'yText should be bind to yDoc.');

    // Plain-Text controls undo-redo itself if undoManager is not provided
    if (!this.undoManager) {
      this.undoManager = new Workspace.Y.UndoManager(this.yText, {
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
    return html`<div class="virgo-container"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'plain-text': PlainText;
  }
}
