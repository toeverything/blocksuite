import type { Query, SyntaxNode } from 'web-tree-sitter';

import type {
  CodeLine,
  CodeLinePositionSelection,
  CodeLineSelection,
} from '../../code-line.js';
import { Widget } from '../widget.js';

type Complete = {
  selection: CodeLineSelection;
  text: string;
};

export class CodeCompleteWidget extends Widget {
  private readonly completeArea = document.createElement('div');
  private matches = new Set<{
    query: Query;
    run: (
      selection: CodeLinePositionSelection,
      name: string,
      node: SyntaxNode
    ) => Complete[];
  }>();

  constructor(
    private ops: {
      matches: {
        query: string;
        run: (
          selection: CodeLineSelection,
          name: string,
          node: SyntaxNode
        ) => Complete[];
      }[];
    }
  ) {
    super();
  }

  protected initView() {
    const style = this.completeArea.style;
    style.position = 'absolute';
    style.zIndex = '1000';
    style.backgroundColor = 'white';
    style.border = '1px solid #ccc';
    style.borderRadius = '4px';
    style.padding = '4px';
    style.display = 'flex';
    style.flexDirection = 'column';
    style.minWidth = '200px';
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
        .auto-complete-selected {
            background-color: #ccc;
        }
        `;
    this.codeLine.append(styleElement);
  }

  protected initHotKey() {
    const listener = (e: KeyboardEvent) => {
      if (!this.completeArea.isConnected) {
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        this.select(
          Math.min(this.completeArea.children.length - 1, this._selectIndex + 1)
        );
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        this.select(Math.max(0, this._selectIndex - 1));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        (
          this.completeArea.children[this._selectIndex] as HTMLDivElement
        )?.click();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.closeComplete();
      }
    };
    this.codeLine.addEventListener('keydown', listener);
    this.disposables.add(() => {
      this.codeLine.removeEventListener('keydown', listener);
    });
  }

  override init(codeLine: CodeLine) {
    super.init(codeLine);
    this.initView();
    this.initHotKey();
    this.ops.matches.forEach(matcher => {
      this.matches.add({
        query: this.codeLine.parser!.language.query(matcher.query),
        run: matcher.run,
      });
    });
    this.disposables.add(
      this.codeLine.events.afterChange.on(() => {
        this.closeComplete();
        const selection = this.codeLine.selection;
        if (!selection || selection.start !== selection.end) return;
        const index = selection.start;
        const result: Complete[] = [];
        for (const { query, run } of this.matches) {
          const queryMatches = query.matches(this.codeLine.tree.rootNode);
          for (const match of queryMatches) {
            for (const capture of match.captures) {
              if (
                capture.node.endIndex < index ||
                capture.node.startIndex > index
              )
                continue;
              result.push(...run(selection, capture.name, capture.node));
            }
          }
        }
        if (result.length === 0) return;
        this.openComplete(index, selection.end, result);
      })
    );
  }

  openComplete(selection: CodeLineSelection, list: Complete[]) {
    this.codeLine.append(this.completeArea);
    this.completeArea.innerHTML = '';
    const range = this.codeLine.selectionToRange(selection);
    if (!range) return;
    const rect = range.getBoundingClientRect();
    const parent = this.completeArea.offsetParent;
    const rootRect = parent?.getBoundingClientRect() ?? { top: 0, left: 0 };
    this.completeArea.style.top = `${rect.bottom - rootRect.top}px`;
    this.completeArea.style.left = `${rect.left - rootRect.left - 20}px`;
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const div = document.createElement('div');
      div.innerText = item.text;
      div.style.cursor = 'pointer';
      div.style.padding = '4px';
      div.style.borderRadius = '4px';
      div.style.margin = '4px';
      div.addEventListener('click', () => {
        const realStart = selection.start + (item.selection.start ?? 0);
        const realEnd = selection.end + (item.selection.end ?? 0);
        this.codeLine.replaceText(realStart, realEnd, item.text);
        this.closeComplete();
      });
      div.addEventListener('mouseenter', () => {
        this.select(i);
      });
      this.completeArea.append(div);
    }
    this.select(0);
  }

  closeComplete() {
    this.completeArea.remove();
  }

  _selectIndex = 0;

  select(index: number) {
    this.completeArea.children[this._selectIndex]?.classList.remove(
      'auto-complete-selected'
    );
    this._selectIndex = index;
    this.completeArea.children[index]?.classList.add('auto-complete-selected');
  }
}
