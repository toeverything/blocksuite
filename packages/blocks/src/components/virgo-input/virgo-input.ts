import { Workspace, type Y } from '@blocksuite/store';
import { VEditor, type VRange } from '@blocksuite/virgo';

interface StackItem {
  meta: Map<'v-range', VRange | null>;
  type: 'undo' | 'redo';
}

export class VirgoInput {
  static Y_TEXT_NAME = 'Y_TEXT_NAME';

  yDoc: Y.Doc = new Workspace.Y.Doc();
  yText: Y.Text;

  vEditor: VEditor;

  private _active = true;

  readonly type: 'default' | 'number' = 'default';
  readonly maxLength = Infinity;

  readonly undoManager: Y.UndoManager;

  constructor(options: {
    yText?: Y.Text | string;
    maxLength?: number;
    type?: 'number';
  }) {
    const {
      yText = this.yDoc.getText(VirgoInput.Y_TEXT_NAME),
      maxLength,
      type,
    } = options;
    const text = yText.toString();

    if (maxLength) {
      this.maxLength = maxLength;
      if (text.length > maxLength) {
        throw new Error('The text exceeds the limit length.');
      }
    }

    if (type) {
      this.type = type;
    }

    if (yText instanceof Workspace.Y.Text) {
      if (yText.doc) {
        this.yText = yText;
        this.yDoc = yText.doc;
      } else {
        throw new Error('Y.Text should be bind to Y.Doc.');
      }
    } else {
      this.yText = this.yDoc.getText(VirgoInput.Y_TEXT_NAME);
      this.yText.insert(0, text);
    }

    this.undoManager = new Workspace.Y.UndoManager(this.yText, {
      trackedOrigins: new Set([this.yDoc.clientID]),
    });
    this.undoManager.on(
      'stack-item-added',
      (event: { stackItem: StackItem }) => {
        const vRange = this.vEditor.getVRange();
        event.stackItem.meta.set('v-range', vRange);
      }
    );
    this.undoManager.on(
      'stack-item-popped',
      (event: { stackItem: StackItem }) => {
        const vRange = event.stackItem.meta.get('v-range');
        if (vRange) {
          this.vEditor.setVRange(vRange);
        }
      }
    );

    this.vEditor = new VEditor(this.yText, {
      hooks: {
        beforeinput: ctx => {
          const { vRange } = ctx;

          let originalText = this.vEditor.yTextString;
          if (vRange.length > 0) {
            originalText = `${originalText.substring(
              0,
              vRange.index
            )}${originalText.substring(vRange.index + vRange.length)}`;
          }
          const tmpText = `${originalText.substring(0, vRange.index)}${
            ctx.data ?? ''
          }${originalText.substring(vRange.index)}`;

          if (tmpText.length >= this.maxLength) {
            return null;
          }

          this.undoManager.stopCapturing();
          return ctx;
        },
        compositionEnd: ctx => {
          const { vRange } = ctx;

          let originalText = this.vEditor.yText.toString();
          if (vRange.length > 0) {
            originalText = `${originalText.substring(
              0,
              vRange.index
            )}${originalText.substring(vRange.index + vRange.length)}`;
          }
          const tmpText = `${originalText.substring(0, vRange.index)}${
            ctx.data
          }${originalText.substring(vRange.index)}`;

          let flag = true;

          if (tmpText.length >= this.maxLength) {
            // We should not directly return null because we need to clear text node from IME.
            ctx.data = '';
            flag = false;
          }

          if (flag) {
            this.undoManager.stopCapturing();
          }

          return ctx;
        },
      },
    });
  }

  mount(rootElement: HTMLElement) {
    this.vEditor.disposables.addFromEvent(
      rootElement,
      'paste',
      (event: ClipboardEvent) => {
        event.stopPropagation();

        const data = event.clipboardData
          ?.getData('text/plain')
          ?.replace(/(\r\n|\r|\n)/g, '\n');
        if (!data) {
          return;
        }

        const vRange = this.vEditor.getVRange();
        if (vRange) {
          if (vRange.length > 0) {
            this.vEditor.yText.delete(vRange.index, vRange.length);
          }
          const length = this.vEditor.yText.length;
          const restLength = this.maxLength - length;
          if (restLength <= 0) {
            return;
          }
          const text =
            data.length > restLength ? data.slice(0, restLength) : data;

          this.vEditor.insertText(vRange, text);
          this.vEditor.setVRange({
            index: vRange.index + text.length,
            length: 0,
          });
          this.undoManager.stopCapturing();
        }
      }
    );
    this.vEditor.disposables.addFromEvent(rootElement, 'keydown', event => {
      if (
        event instanceof KeyboardEvent &&
        (event.ctrlKey || event.metaKey) &&
        (event.key === 'z' || event.key === 'Z')
      ) {
        event.preventDefault();
        if (event.shiftKey) {
          this.redo();
        } else {
          this.undo();
        }
      }
    });
    this.vEditor.disposables.addFromEvent(rootElement, 'blur', () => {
      if (this.type === 'number') {
        const text = this.yText.toString();
        const num = parseFloat(text);
        const transformedText = isNaN(num) ? '' : num.toString();
        if (text !== transformedText) {
          this.setActive(false);
          this.setValue(transformedText);
          // prevent vRange applied after value changed
          requestAnimationFrame(() => {
            this.setActive(true);
          });
        }
      }
    });

    this.vEditor.mount(rootElement);
  }

  unmount() {
    this.vEditor.unmount();
  }

  get value() {
    return this.yText.toString();
  }

  get active() {
    return this._active;
  }

  setActive(value: boolean) {
    this._active = value;
  }

  setValue(str: string) {
    if (str.length > this.maxLength) {
      throw new Error('The text exceeds the limit length.');
    }

    this.yText.delete(0, this.yText.length);
    this.yText.insert(0, str);
    this.vEditor.setVRange({
      index: str.length,
      length: 0,
    });
    this.undoManager.stopCapturing();
  }

  undo() {
    this.undoManager.undo();
  }

  redo() {
    this.undoManager.redo();
  }
}
