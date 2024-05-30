import type Parser from 'web-tree-sitter';

import type { CodeLine } from '../../code-line.js';
import { Widget } from '../widget.js';

export class CodeErrorWidget extends Widget {
  private readonly errorArea = document.createElement('div');

  private initView() {
    this.errorArea.style.position = 'absolute';
    this.errorArea.style.left = '0';
    this.errorArea.style.top = '0';
    this.codeLine.append(this.errorArea);
  }

  override init(codeLine: CodeLine) {
    super.init(codeLine);
    this.initView();
    this.disposables.add(
      this.codeLine.events.afterChange.on(() => {
        const errors = this.getError(this.codeLine.tree.rootNode);
        this.errorArea.innerHTML = '';
        const baseRect = this.errorArea.getBoundingClientRect();
        for (const error of errors) {
          const range = this.codeLine.selectionToRange({
            start: error.startPosition,
            end: error.endPosition,
          });
          if (range) {
            for (const rect of range.getClientRects()) {
              const div = document.createElement('div');
              div.style.position = 'absolute';
              div.style.left = `${rect.left - baseRect.left}px`;
              div.style.top = `${rect.top + rect.height - 1 - baseRect.top}px`;
              div.style.width = `${rect.width}px`;
              div.style.height = `1px`;
              div.style.backgroundColor = 'red';
              this.errorArea.append(div);
            }
          }
        }
      })
    );
  }

  getError = (node: Parser.SyntaxNode): Parser.SyntaxNode[] => {
    const result: Parser.SyntaxNode[] = [];
    if (node.isError) {
      result.push(node);
    }
    if (node.hasError) {
      result.push(...node.children.flatMap(this.getError));
    }
    return result;
  };
}
