import { Document as DocumentIndexer, DocumentSearchOptions } from 'flexsearch';
import { Doc, Map as YMap, Text as YText } from 'yjs';
import type { YBlock } from './space';

export type QueryContent = string | Partial<DocumentSearchOptions<boolean>>;

function tokenizeZh(text: string) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const tokenizer = Intl?.v8BreakIterator;
  if (tokenizer) {
    const it = tokenizer(['zh-CN'], { type: 'word' });
    it.adoptText(text);
    const words = [];

    let cur = 0,
      prev = 0;

    while (cur < text.length) {
      prev = cur;
      cur = it.next();
      words.push(text.substring(prev, cur));
    }

    return words;
  }
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x7F]/g, '').split('');
}

export type IndexMetadata = Readonly<{
  content: string | undefined;
  reference: string | undefined;
  tags: string[];
}>;

export class Indexer {
  readonly _doc: Doc;
  readonly _indexer: DocumentIndexer<IndexMetadata>;

  constructor(doc: Doc) {
    this._doc = doc;
    this._indexer = new DocumentIndexer<IndexMetadata>({
      document: {
        id: 'id',
        index: ['content', 'reference'],
        tag: 'tags',
      },
      encode: tokenizeZh,
      tokenize: 'forward',
      context: true,
    });

    Array.from(doc.share.keys())
      .map(k => [k, this._getSpace(k)] as const)
      .forEach(([spaceId, space]) => this._handleSpaceIndexing(spaceId, space));
  }

  onCreateSpace(spaceId: string) {
    this._handleSpaceIndexing(spaceId, this._getSpace(spaceId));
  }

  search(query: QueryContent) {
    this._indexer.search(query as string);
  }

  private _handleSpaceIndexing(spaceId: string, space?: YMap<YBlock>) {
    if (space) {
      space.forEach((block, key) => {
        this._refreshIndex(spaceId, key, 'add', space.get(key));
        console.log(block, key);
      });

      space.observeDeep(events => {
        const keys = events.flatMap(e => {
          // eslint-disable-next-line no-bitwise
          if ((e.path?.length | 0) > 0) {
            return [[e.path[0], 'update'] as [string, 'update']];
          }
          return Array.from(e.changes.keys.entries()).map(
            ([k, { action }]) => [k, action] as [string, typeof action]
          );
        });

        if (keys.length) {
          keys.forEach(([key, action]) => {
            this._refreshIndex(spaceId, key, action, space.get(key));
          });
        }
      });
    }
  }

  private _refreshIndex(
    space: string,
    id: string,
    action: 'add' | 'update' | 'delete',
    block?: YBlock
  ) {
    switch (action) {
      case 'add':
      case 'update': {
        if (block) {
          const content = this._toContent(
            block.get('prop:title') || block.get('prop:text')
          );
          if (content) {
            console.log({
              content,
              reference: '',
              tags: [space],
            });
            this._indexer.add(id, {
              content,
              reference: '',
              tags: [space],
            });
          }
        }

        break;
      }
      case 'delete': {
        this._indexer.remove(id);
        break;
      }
    }
  }

  private _toContent(obj: unknown) {
    if (obj) {
      if (typeof obj === 'string') {
        return obj;
      } else if (obj instanceof YText) {
        return obj.toJSON();
      }
    }
    return undefined;
  }

  private _getSpace(key: string): YMap<YBlock> | undefined {
    try {
      // we only indexing blocks in spaces
      if (key.startsWith('space:')) {
        return this._doc.getMap(key);
      }
      return undefined;
    } catch (_) {
      return undefined;
    }
  }
}
