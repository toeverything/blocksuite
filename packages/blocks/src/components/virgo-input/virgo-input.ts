import { VEditor } from '@blocksuite/virgo';
import * as Y from 'yjs';

import { activeEditorManager } from '../../__internal__/utils/active-editor-manager.js';
import { isDecimal } from './utils.js';

export class VirgoInput {
  static YTEXT_NAME = 'YTEXT_NAME';

  yDoc: Y.Doc = new Y.Doc();
  yText: Y.Text;

  vEditor: VEditor;

  private _active = true;

  readonly type: 'default' | 'number' = 'default';
  readonly maxLength = Infinity;

  readonly undoManager: Y.UndoManager;

  constructor(options: {
    rootElement: HTMLElement;
    yText?: Y.Text | string;
    maxLength?: number;
    type?: 'number';
  }) {
    const {
      rootElement,
      yText = this.yDoc.getText(VirgoInput.YTEXT_NAME),
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
      if (type === 'number' && !isDecimal(text) && text.length > 0) {
        throw new Error('Illegal digital type text.');
      }
    }

    if (yText instanceof Y.Text) {
      if (yText.doc) {
        this.yText = yText;
        this.yDoc = yText.doc;
      } else {
        throw new Error('Y.Text should be binded to Y.Doc.');
      }
    } else {
      this.yText = this.yDoc.getText(VirgoInput.YTEXT_NAME);
      this.yText.insert(0, text);
    }

    this.undoManager = new Y.UndoManager(this.yText);

    this.vEditor = new VEditor(this.yText, {
      active: () =>
        activeEditorManager.isActive(options.rootElement) && this.active,
    });
    this.vEditor.mount(rootElement);
    this.vEditor.bindHandlers({
      paste: (event: ClipboardEvent) => {
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
          const originalText = this.vEditor.yText.toString();
          const tmpText = `${originalText.substring(
            0,
            vRange.index
          )}${text}${originalText.substring(vRange.index)}`;

          if (this.type === 'number' && !isDecimal(tmpText)) {
            return;
          }

          this.vEditor.insertText(vRange, text);
          this.vEditor.setVRange({
            index: vRange.index + text.length,
            length: 0,
          });
          this.undoManager.stopCapturing();
        }
      },
      virgoInput: ctx => {
        const vRange = this.vEditor.getVRange();
        if (!vRange) {
          return ctx;
        }
        if (vRange.length > 0) {
          this.vEditor.yText.delete(vRange.index, vRange.length);
        }

        const originalText = this.vEditor.yText.toString();
        const tmpText = `${originalText.substring(0, vRange.index)}${
          ctx.data ?? ''
        }${originalText.substring(vRange.index)}`;

        let flag = true;

        if (tmpText.length >= this.maxLength) {
          ctx.skipDefault = true;
          flag = false;
        }

        if (this.type === 'number' && !isDecimal(tmpText)) {
          ctx.skipDefault = true;
          flag = false;
        }

        if (flag) {
          this.undoManager.stopCapturing();
        }

        return ctx;
      },
      virgoCompositionEnd: ctx => {
        const vRange = this.vEditor.getVRange();
        if (!vRange) {
          return ctx;
        }
        if (vRange.length > 0) {
          this.vEditor.yText.delete(vRange.index, vRange.length);
        }

        const originalText = this.vEditor.yText.toString();
        const tmpText = `${originalText.substring(0, vRange.index)}${
          ctx.data
        }${originalText.substring(vRange.index)}`;

        let flag = true;

        if (tmpText.length >= this.maxLength) {
          // We should not use `skipDefault` because we need to clear text node from IME.
          ctx.data = '';
          flag = false;
        }

        if (this.type === 'number' && !isDecimal(tmpText)) {
          ctx.data = '';
          flag = false;
        }

        if (flag) {
          this.undoManager.stopCapturing();
        }

        return ctx;
      },
      keydown: e => {
        if (
          e instanceof KeyboardEvent &&
          (e.ctrlKey || e.metaKey) &&
          (e.key === 'z' || e.key === 'Z')
        ) {
          e.preventDefault();
          if (e.shiftKey) {
            this.redo();
          } else {
            this.undo();
          }
        }
      },
    });
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

    if (this.type === 'number' && !isDecimal(str)) {
      throw new Error('Illegal digital type text.');
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
