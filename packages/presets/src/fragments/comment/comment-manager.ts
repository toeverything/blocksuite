import type { TextSelection } from '@blocksuite/block-std';
import type { EditorHost } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { DocCollection, type Y } from '@blocksuite/store';

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

export type Comment = CommentMeta & CommentRange & CommentContent;

export class CommentManager {
  constructor(public readonly host: EditorHost) {}

  get commentsMap() {
    return this.host.doc.spaceDoc.getMap<Y.Map<unknown>>('comments');
  }

  parseTextSelection(selection: TextSelection): {
    quote: CommentContent['quote'];
    range: CommentRange;
  } | null {
    const [_, ctx] = this._command
      .chain()
      .getSelectedBlocks({
        currentTextSelection: selection,
        types: ['text'],
      })
      .run();
    const blocks = ctx.selectedBlocks;
    if (!blocks || blocks.length === 0) return null;

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

    const startIndex = DocCollection.Y.createRelativePositionFromTypeIndex(
      fromBlockText.yText,
      from.index
    );
    const endIndex = DocCollection.Y.createRelativePositionFromTypeIndex(
      toBlockText.yText,
      to ? to.index + to.length : from.index + from.length
    );
    const quote = blocks.reduce((acc, block, index) => {
      const text = block.model.text;
      if (!text) return acc;

      if (index === 0) {
        return (
          acc +
          text.yText.toString().slice(from.index, from.index + from.length)
        );
      }
      if (index === blocks.length - 1 && to) {
        return acc + ' ' + text.yText.toString().slice(0, to.index + to.length);
      }

      return acc + ' ' + text.yText.toString();
    }, '');

    return {
      quote,
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
    };
  }

  addComment(
    selection: TextSelection,
    payload: Pick<CommentContent, 'author' | 'text'>
  ): Comment {
    const parseResult = this.parseTextSelection(selection);
    if (!parseResult) {
      throw new Error('Invalid selection');
    }

    const { quote, range } = parseResult;
    const id = this.host.doc.collection.idGenerator();
    const comment: Comment = {
      id,
      date: Date.now(),
      start: range.start,
      end: range.end,
      quote,
      ...payload,
    };
    this.commentsMap.set(
      id,
      new DocCollection.Y.Map<unknown>(Object.entries(comment))
    );
    return comment;
  }

  getComments(): Comment[] {
    const comments: Comment[] = [];
    this.commentsMap.forEach((comment, key) => {
      const start = comment.get('start') as Comment['start'];
      const end = comment.get('end') as Comment['end'];

      const startIndex =
        DocCollection.Y.createAbsolutePositionFromRelativePosition(
          start.index,
          this.host.doc.spaceDoc
        );
      const startBlock = this.host.view.viewFromPath('block', start.path);
      const endIndex =
        DocCollection.Y.createAbsolutePositionFromRelativePosition(
          end.index,
          this.host.doc.spaceDoc
        );
      const endBlock = this.host.view.viewFromPath('block', end.path);

      if (!startIndex || !startBlock || !endIndex || !endBlock) {
        // remove outdated comment
        this.commentsMap.delete(key);
        return;
      }

      const result: Comment = {
        id: comment.get('id') as Comment['id'],
        date: comment.get('date') as Comment['date'],
        start,
        end,
        quote: comment.get('quote') as Comment['quote'],
        author: comment.get('author') as Comment['author'],
        text: comment.get('text') as Comment['text'],
      };
      comments.push(result);
    });
    return comments;
  }

  private get _command() {
    return this.host.command;
  }
}
