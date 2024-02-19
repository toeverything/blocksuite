import type { TextSelection } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import { Workspace, type Y } from '@blocksuite/store';

export interface CommentMeta {
  id: string;
  date: number;
}
export interface CommentRange {
  start: {
    path: string[];
    index: Y.RelativePosition;
  };
  end: {
    path: string[];
    index: Y.RelativePosition;
  };
}
export interface CommentContent {
  quote: string;
  author: string;
  text: Y.Text;
}

export interface Comment {
  meta: CommentMeta;
  range: CommentRange;
  content: CommentContent;
}

export class CommentManager {
  constructor(public readonly host: EditorHost) {}

  get commentsMap() {
    return this.host.page.spaceDoc.getMap<Comment>('comments');
  }

  addComment(selection: TextSelection, content: CommentContent) {
    const blocks = this._command.getChainCtx(
      this._command
        .pipe()
        .withHost()
        .getSelectedBlocks({
          currentTextSelection: selection,
          types: ['text'],
        })
    ).selectedBlocks;
    if (!blocks || blocks.length === 0) {
      return;
    }

    const { from, to } = selection;
    const fromBlock = blocks[0];
    const fromBlockText = fromBlock.model.text;
    const fromBlockPath = fromBlock.path;
    assertExists(fromBlockText);
    assertExists(fromBlockPath);
    const toBlock = blocks[blocks.length - 1];
    const toBlockText = toBlock.model.text;
    const toBlockPath = toBlock.path;
    assertExists(toBlockText);
    assertExists(toBlockPath);

    const startIndex = Workspace.Y.createRelativePositionFromTypeIndex(
      fromBlockText.yText,
      from.index
    );
    const endIndex = Workspace.Y.createRelativePositionFromTypeIndex(
      toBlockText.yText,
      to ? to.index + to.length : from.index + from.length
    );
    const id = this.host.page.workspace.idGenerator();
    this.commentsMap.set(id, {
      meta: {
        id,
        date: Date.now(),
      },
      range: {
        start: {
          path: fromBlockPath,
          index: startIndex,
        },
        end: {
          path: toBlockPath,
          index: endIndex,
        },
      },
      content,
    });
  }

  getComments() {
    const comments: Comment[] = [];
    this.commentsMap.forEach((comment, key) => {
      const { range } = comment;
      const { start, end } = range;

      const startIndex = Workspace.Y.createAbsolutePositionFromRelativePosition(
        start.index,
        this.host.page.spaceDoc
      );
      const startBlock = this.host.view.viewFromPath('block', start.path);
      const endIndex = Workspace.Y.createAbsolutePositionFromRelativePosition(
        end.index,
        this.host.page.spaceDoc
      );
      const endBlock = this.host.view.viewFromPath('block', end.path);

      if (!startIndex || !startBlock || !endIndex || !endBlock) {
        // remove outdated comment
        this.commentsMap.delete(key);
        return;
      }

      comments.push(comment);
    });
    return comments;
  }

  private get _command() {
    return this.host.command;
  }
}
