import { UIEventState, UIEventStateContext } from '../base.js';
import type {
  EventName,
  EventScope,
  UIEventDispatcher,
} from '../dispatcher.js';

export class RangeControl {
  private _prev: Range | null = null;
  constructor(private _dispatcher: UIEventDispatcher) {}

  listen() {
    this._dispatcher.disposables.addFromEvent(
      document,
      'selectionchange',
      this._selectionChange
    );
  }

  private _createContext(event: Event) {
    return UIEventStateContext.from(new UIEventState(event));
  }

  private _selectionChange = (event: Event) => {
    let scope: EventScope | undefined;
    const selection = document.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      scope = this._buildEventScopeByNativeRange('selectionChange', range);
      this._prev = range;
    } else if (this._prev !== null) {
      scope = this._buildEventScopeByNativeRange('selectionChange', this._prev);
      this._prev = null;
    }

    this._dispatcher.run('selectionChange', this._createContext(event), scope);
  };

  private _buildEventScopeByNativeRange(name: EventName, range: Range) {
    const blocks = this._findBlockElement(range);
    const paths = blocks
      .map(blockView => {
        return this._dispatcher.blockStore.viewStore.blockViewMap.getPath(
          blockView
        );
      })
      .filter((path): path is string[] => !!path);
    const flavours = Array.from(
      new Set(
        paths
          .flatMap(path => {
            return path.map(blockId => {
              return this._dispatcher.blockStore.page.getBlockById(blockId)
                ?.flavour;
            });
          })
          .filter((flavour): flavour is string => {
            return !!flavour;
          })
      )
    ).reverse();

    return this._dispatcher.buildEventScope(name, flavours, paths);
  }

  private _findBlockElement(range: Range): unknown[] {
    const start = range.startContainer;
    const end = range.endContainer;
    const ancestor = range.commonAncestorContainer;
    const getBlockView = this._dispatcher.blockStore.config.getBlockViewByNode;
    if (ancestor.nodeType === Node.TEXT_NODE) {
      return [getBlockView(ancestor)];
    }
    const nodes = new Set<Node>();

    let startRecorded = false;
    const dfsDOMSearch = (current: Node | null, ancestor: Node) => {
      if (!current) {
        return;
      }
      if (current === ancestor) {
        return;
      }
      if (current === end) {
        nodes.add(current);
        startRecorded = false;
        return;
      }
      if (current === start) {
        startRecorded = true;
      }
      if (startRecorded) {
        if (
          current.nodeType === Node.TEXT_NODE ||
          current.nodeType === Node.ELEMENT_NODE
        ) {
          nodes.add(current);
        }
      }
      dfsDOMSearch(current.firstChild, ancestor);
      dfsDOMSearch(current.nextSibling, ancestor);
    };
    dfsDOMSearch(ancestor.firstChild, ancestor);

    const blocks = new Set<unknown>();
    nodes.forEach(node => {
      const blockView = getBlockView(node);
      if (!blockView) {
        return;
      }
      if (blocks.has(blockView)) {
        return;
      }
      blocks.add(blockView);
    });
    return Array.from(blocks);
  }
}
