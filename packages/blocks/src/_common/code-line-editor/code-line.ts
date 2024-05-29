import Parser from 'web-tree-sitter';

import type { Disposable } from './disposable.js';
import { CompositeDisposable } from './disposable.js';
import { Emitter } from './emitter.js';
import type { Widget } from './widget/widget.js';

type LineEditorOptions = {
  source?: string;
  language: Parser.Language;
  widgets?: Widget[];
};
export type CodeLineSelection = {
  start: number;
  end: number;
};

export class CodeLine implements Disposable {
  private disposables = new CompositeDisposable();
  private widgets = new Set<Widget>();
  private parser!: Parser;
  private _tree!: Parser.Tree;
  public get tree() {
    return this._tree;
  }

  private set tree(value: Parser.Tree) {
    this._tree = value;
  }

  private source: string;
  private _selection?: CodeLineSelection;
  public readonly language: Parser.Language;
  public readonly codeArea = document.createElement('div');
  events = {
    beforeChange: new Emitter<void>(),
    afterChange: new Emitter<void>(),
  };

  private constructor(
    public root: HTMLElement,
    ops: LineEditorOptions
  ) {
    this.source = ops.source ?? '';
    this.language = ops.language;
    this.widgets = new Set(ops.widgets ?? []);
  }

  dispose() {
    this.disposables.dispose();
  }

  static create(ele: HTMLElement, ops: LineEditorOptions) {
    const editor = new CodeLine(ele, ops);
    editor.init();
    return editor;
  }

  private initRoot() {
    this.root.style.position = 'relative';
    this.root.style.fontFamily = 'monospace';
    this.root.style.whiteSpace = 'pre';
  }

  private initCodeArea() {
    this.codeArea.contentEditable = 'true';
    this.codeArea.style.outline = 'none';
    this.codeArea.spellcheck = false;
    this.root.append(this.codeArea);
  }

  init() {
    this.parser = new Parser();
    this.parser.setLanguage(this.language);

    this.initRoot();
    this.initCodeArea();
    this.listenInput();
    this.listenSelectionChange();
    this.widgets.forEach(v => v.init(this));
    this.sourceChange(this.source);
  }

  listenInput() {
    const listener = () => {
      this.sourceChange(this.codeArea.innerText);
    };
    this.root.addEventListener('input', listener);
    this.disposables.add(() => {
      this.root.removeEventListener('input', listener);
    });
  }

  listenSelectionChange() {
    document.addEventListener('selectionchange', this.fromSelectionChange);
    this.disposables.add(() => {
      document.removeEventListener('selectionchange', this.fromSelectionChange);
    });
  }

  selectionToRange = (
    startIndex: number,
    endIndex: number
  ): Range | undefined => {
    const range = document.createRange();
    const start = this.findNode(startIndex);
    const end = this.findNode(endIndex);
    if (start && end) {
      range.setStart(start.node, start.index);
      range.setEnd(end.node, end.index);
      return range;
    }
    return;
  };

  private fromSelectionChange = () => {
    const selection = window.getSelection();
    if (selection?.rangeCount) {
      const range = selection.getRangeAt(0);
      const getOffset = (node: Node) => {
        const codeNode = node.parentElement?.closest('[data-code-node]');
        return codeNode ? parseInt(codeNode.dataset.offset ?? '0') : 0;
      };
      const startOffset = getOffset(range.startContainer);
      const endOffset = getOffset(range.endContainer);
      this._selection = {
        start: startOffset + range.startOffset,
        end: endOffset + range.endOffset,
      };
    }
  };

  findNode(index: number):
    | {
        node: Node;
        index: number;
      }
    | undefined {
    for (const child of this.codeArea.children) {
      const offset = parseInt(child.dataset.offset ?? '0');
      if (
        offset <= index &&
        offset + (child.textContent?.length ?? 0) >= index
      ) {
        return {
          node: child.firstChild as Node,
          index: index - offset,
        };
      }
    }
    return;
  }

  restoreSelection() {
    if (this.selection) {
      const range = this.selectionToRange(
        this.selection.start,
        this.selection.end
      );
      if (range) {
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  }

  public get selection() {
    return this._selection;
  }

  public setSelection(start: number, end: number) {
    this._selection = {
      start,
      end,
    };
    this.restoreSelection();
  }

  sourceChange(
    newText: string,
    change?: {
      start: number;
      newEnd: number;
      oldEnd: number;
    }
  ) {
    this.events.beforeChange.emit();
    this.source = newText;
    if (change) {
      this.tree = this.tree.edit({
        startIndex: change.start,
        oldEndIndex: change.oldEnd,
        newEndIndex: change.newEnd,
        startPosition: { row: 0, column: change.start },
        oldEndPosition: { row: 0, column: change.oldEnd },
        newEndPosition: { row: 0, column: change.newEnd },
      });
      this.tree = this.parser.parse(this.source, this.tree);
    } else {
      this.tree = this.parser.parse(this.source);
    }
    this.renderTree();
  }

  findSyntaxNode = (index: number) => {
    let lastNode: Parser.SyntaxNode | undefined;
    const find = (index: number, cursor: Parser.TreeCursor) => {
      if (cursor.startIndex < index) {
        lastNode = cursor.currentNode;
        if (cursor.currentNode.childCount > 0) {
          cursor.gotoFirstChild();
          find(index, cursor);
          return;
        }
        const findNext = (cursor: Parser.TreeCursor) => {
          if (cursor.currentNode.nextSibling) {
            cursor.gotoNextSibling();
            find(index, cursor);
            return;
          }
          if (cursor.currentNode.parent) {
            cursor.gotoParent();
            findNext(cursor);
            return;
          }
        };
        findNext(cursor);
      }
    };
    const cursor = this.tree.walk();
    find(index, cursor);
    return lastNode;
  };

  renderTree() {
    this.fromSelectionChange();
    const lines = this.source.split('\n');
    const result: { text: string; offset: number }[] = [];
    let offset = 0;
    this.codeArea.innerHTML = '';
    for (const line of lines) {
      result.push({
        text: line,
        offset,
      });
      offset += line.length + 1;
    }
    for (const { text, offset } of result) {
      const node = document.createElement('span');
      node.append(document.createTextNode(text));
      node.dataset.offset = offset.toString();
      node.dataset.codeNode = true.toString();
      this.codeArea.append(node);
    }
    this.restoreSelection();
    this.events.afterChange.emit();
  }

  replaceText(start: number, end: number, text: string) {
    this.sourceChange(
      this.source.slice(0, start) + text + this.source.slice(end)
    );
    this.setSelection(start + text.length, start + text.length);
  }
}
