import type Parser from 'web-tree-sitter';

import type { CodeLine } from '../../code-line.js';
import { Widget } from '../widget.js';

export class CodeHighlightWidget extends Widget {
  private highlightQuery?: Parser.Query;
  private highlights: string[] = [];

  constructor(private highlight: string) {
    super();
  }

  override init(codeLine: CodeLine) {
    super.init(codeLine);
    try {
      this.highlightQuery = this.codeLine.parser?.language.query(
        this.highlight
      );
    } catch (e) {
      console.error(e);
    }
    this.disposables.add(
      this.codeLine.events.afterChange.on(() => {
        this.clearHighlight();
        this.addHighlight();
      })
    );
  }

  clearHighlight() {
    this.highlights.forEach(name => {
      CSS.highlights.delete(`clh-${name}`);
    });
  }

  addHighlight() {
    const map = new Map<string, Parser.SyntaxNode[]>();
    const captures = this.highlightQuery?.captures(this.codeLine.tree.rootNode);
    captures?.forEach(v => {
      if (!map.has(v.name)) {
        map.set(v.name, [v.node]);
      } else {
        map.get(v.name)?.push(v.node);
      }
    });
    const lines = this.codeLine.codeArea.children;
    map.forEach((nodes, name) => {
      const ranges = nodes.map(node => {
        const range = new Range();
        range.setStart(
          lines[node.startPosition.row].childNodes[0],
          node.startPosition.column
        );
        range.setEnd(
          lines[node.endPosition.row].childNodes[0],
          node.endPosition.column
        );
        return range;
      });
      CSS.highlights.set(`clh-${name}`, new Highlight(...ranges));
      this.highlights.push(name);
    });
    // const range1 = new Range();
    // range1.setStart(lines[0].childNodes[0], 0);
    // range1.setEnd(lines[0].childNodes[0], 2);
    // const range2 = new Range();
    // range2.setStart(lines[0].childNodes[0], 1);
    // range2.setEnd(lines[0].childNodes[0], 3);
    // CSS.highlights.set('test1',new Highlight(range1))
    // CSS.highlights.set('test2',new Highlight(range2))
  }
}
