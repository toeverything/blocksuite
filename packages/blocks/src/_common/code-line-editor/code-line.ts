import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import type { SyntaxNode, Tree } from 'web-tree-sitter';

import { Emitter } from './emitter.js';
import {
  getQueryLangParser,
  type QueryLangParser,
} from './query-lang-parser.js';
import { codeLineWidgetPresets } from './widget/index.js';
import type { Widget } from './widget/widget.js';

export type CodeLinePositionSelection = {
  start: {
    row: number;
    column: number;
  };
  end: {
    row: number;
    column: number;
  };
};
export type CodeLineSelection = {
  start: number;
  end: number;
};

export const CodeLineSelection = {
  toPosition(
    selection: CodeLineSelection,
    text: string
  ): CodeLinePositionSelection {
    const lines = text.split('\n');
    const offset = 0;
    const result: CodeLinePositionSelection = {
      start: {
        row: 0,
        column: 0,
      },
      end: {
        row: 0,
        column: 0,
      },
    };
    for (const line of lines) {
      if (offset + line.length > selection.start) {
        result.start = {
          row: result.start.row + 1,
          column: selection.start - offset,
        };
      }
      if (offset + line.length > selection.end) {
        result.end = {
          row: result.start.row + 1,
          column: selection.end - offset,
        };
        break;
      }
    }
    return result;
  },
};

const variableList = [
  'column1',
  'column2',
  'column3',
  'column4',
  'JSON',
  'true',
  'false',
  'window',
  'console',
];
const functionList = [
  'max',
  'min',
  'abs',
  'sqrt',
  'pow',
  'length',
  'normalize',
  'slice',
  'parse',
];
const buildComplete = (
  options: string[],
  selection: CodeLineSelection,
  node: SyntaxNode
) => {
  return options.filter(filter(node.text)).map(v => ({
    text: v,
    offsetStart: node.startIndex - selection.start,
    offsetEnd: node.endIndex - selection.end,
  }));
};
const filter = (text: string) => (s: string) => {
  return s.startsWith(text) && text != s;
};

const widgets = [
  new codeLineWidgetPresets.CodeErrorWidget(),
  new codeLineWidgetPresets.CodeHighlightWidget(`
(binary_expression operator:_ @operator)
(number) @number
(string) @string
(boolean) @boolean
(dot_expression "." @operator)
(identifier) @identifier
(query_expression [(_ ["query" "as" "where" "order" "by" "desc" "asc" "skip" "take"] @keyword) "query" @keyword])
`),
  new codeLineWidgetPresets.CodeCompleteWidget({
    matches: [
      {
        query: '(dot_expression function:(_) @function)',
        run: (selection, _name, node) =>
          buildComplete(functionList, selection, node),
      },
      {
        query: '(expression) @exp',
        run: (selection, _name, node) =>
          buildComplete([...variableList, ...functionList], selection, node),
      },
    ],
  }),
];

@customElement('code-line-editor')
export class CodeLine extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      position: relative;
      white-space: pre-wrap;
      font-family: monospace;
    }

    ::highlight(clh-identifier) {
      color: rgba(193, 122, 181);
    }

    ::highlight(clh-keyword) {
      color: rgba(207, 141, 108);
    }

    ::highlight(clh-string) {
      color: rgba(106, 170, 114);
    }

    ::highlight(clh-number) {
      color: rgba(41, 171, 183);
    }

    ::highlight(clh-operator) {
      color: black;
    }

    ::highlight(clh-boolean) {
      color: rgba(207, 141, 108);
    }
  `;
  private widgets = new Set<Widget>(widgets);
  private _tree!: Tree;
  public get tree() {
    return this._tree;
  }

  private set tree(value: Tree) {
    this._tree = value;
  }

  @property()
  public accessor source!: string;
  private _selection?: CodeLinePositionSelection;
  @state()
  public accessor parser: QueryLangParser | undefined;
  @query('.code-area')
  public accessor codeArea!: HTMLDivElement;
  events = {
    beforeChange: new Emitter<void>(),
    afterChange: new Emitter<void>(),
  };

  override connectedCallback() {
    super.connectedCallback();
    getQueryLangParser()
      .then(parser => {
        this.parser = parser;
        this.listenInput();
        this.listenSelectionChange();
        this.widgets.forEach(v => v.init(this));
        this.sourceChange(this.source);
      })
      .catch(console.error);
  }

  listenInput() {
    const listener = () => {
      this.sourceChange(this.codeArea.innerText);
    };
    this.codeArea?.addEventListener('input', listener);
    this.disposables.add(() => {
      this.codeArea?.removeEventListener('input', listener);
    });
  }

  listenSelectionChange() {
    this.addEventListener('selectionchange', this.fromSelectionChange);
    this.disposables.add(() => {
      this.removeEventListener('selectionchange', this.fromSelectionChange);
    });
  }

  selectionToRange = (
    selection: CodeLinePositionSelection
  ): Range | undefined => {
    const range = document.createRange();
    const start = this.findNode(selection.start.row, selection.start.column);
    const end = this.findNode(selection.end.row, selection.end.column);
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
      const getRow = (node: Node) => {
        const codeNode = node.parentElement?.closest(
          '[data-code-node]'
        ) as HTMLElement;
        return codeNode ? parseInt(codeNode.dataset.row ?? '0') : 0;
      };
      console.log(range);
      this._selection = {
        start: {
          row: getRow(range.startContainer),
          column: range.startOffset,
        },
        end: {
          row: getRow(range.endContainer),
          column: range.endOffset,
        },
      };
    }
  };

  get lines() {
    return Array.from(this.codeArea.children) as HTMLElement[];
  }

  findNode(
    row: number,
    column: number
  ):
    | {
        node: Node;
        index: number;
      }
    | undefined {
    for (const line of this.lines) {
      const lineIndex = parseInt(line.dataset.row ?? '0');
      if (lineIndex <= row) {
        return {
          node: line.firstChild as Node,
          index: column,
        };
      }
    }
    return;
  }

  restoreSelection() {
    if (this.selection) {
      const range = this.selectionToRange(this.selection);
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

  public setSelection(selection: CodeLinePositionSelection) {
    this._selection = selection;
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
    if (!this.parser) {
      return;
    }
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

  protected override render(): unknown {
    return html`
      <div
        class="code-area"
        contenteditable="true"
        spellcheck="false"
        style="outline: none"
      ></div>
    `;
  }

  renderTree() {
    this.fromSelectionChange();
    const lines = this.source.split('\n');
    this.codeArea.innerHTML = '';
    for (let i = 0; i < lines.length; i++) {
      const text = lines[i];
      const node = document.createElement('span');
      node.append(document.createTextNode(text));
      node.dataset.row = i.toString();
      node.dataset.codeNode = true.toString();
      this.codeArea.append(node);
    }
    this.restoreSelection();
    this.events.afterChange.emit();
  }

  replaceText(selection: CodeLineSelection, text: string) {
    const newText =
      this.source.slice(0, selection.start) +
      text +
      this.source.slice(selection.end);
    this.sourceChange(newText, {
      start: selection.start,
      newEnd: selection.start + text.length,
      oldEnd: selection.end,
    });
    this.setSelection(
      CodeLineSelection.toPosition(
        {
          start: selection.start + text.length,
          end: selection.start + text.length,
        },
        newText
      )
    );
  }
}
