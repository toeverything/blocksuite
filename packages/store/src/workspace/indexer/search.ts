import type { DocumentSearchOptions } from 'flexsearch';
import FlexSearch from 'flexsearch';
import type { Doc, Map as YMap } from 'yjs';
import { Text as YText } from 'yjs';

import type { YBlock } from '../page.js';

const DocumentIndexer = FlexSearch.Document;
const Index = FlexSearch.Index;

export type QueryContent = string | Partial<DocumentSearchOptions<boolean>>;

type SearchResult = { id: string; doc: { space: string } };
type SearchResults = { field: string; result: SearchResult[] };

function tokenize(locale: string) {
  const tokenizer = Intl?.Segmenter;
  if (tokenizer) {
    // extract the latin encoder inside flexsearch
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const latinIndexer: any = new Index({ charset: 'latin:advanced' });
    const latinEncoder = latinIndexer.encode.bind(latinIndexer);
    // check latin characters
    const latinChecker = /^[\p{Script=Latin}\p{Mark}\d]+$/u;

    const segmenter = new tokenizer([locale], { granularity: 'word' });
    return (text: string) => {
      const latinChars: string[] = [];
      const cjkChars = Array.from(segmenter.segment(text))
        .filter(s => {
          if (s.isWordLike) {
            if (!latinChecker.test(s.segment)) {
              return true;
            }
            latinChars.push(s.segment);
          }
          return false;
        })
        .map(s => s.segment);

      return [...cjkChars, ...latinEncoder(latinChars.join(' '))];
    };
  }
  return (text: string) => {
    // eslint-disable-next-line no-control-regex
    return text.replace(/[\x00-\x7F]/g, '').split('');
  };
}

export type IndexMeta = Readonly<{
  content: string;
  reference?: string;
  space: string;
  tags: string[];
}>;

export class SearchIndexer {
  private readonly _doc: Doc;
  private readonly _indexer: FlexSearch.Document<IndexMeta, string[]>;

  constructor(
    doc: Doc,
    // locale string based on https://www.w3.org/International/articles/bcp47/
    locale = 'en-US'
  ) {
    this._doc = doc;
    this._indexer = new DocumentIndexer<IndexMeta, string[]>({
      document: {
        id: 'id',
        index: ['content', 'reference', 'space'],
        tag: 'tags',
        store: ['space'],
      },
      encode: tokenize(locale),
      tokenize: 'forward',
      context: true,
    });

    Array.from(doc.share.keys())
      .map(k => [k, this._getPage(k)] as const)
      .forEach(([pageId, page]) => this._handlePageIndexing(pageId, page));
  }

  // TODO: remove this method, observe page meta instead
  onPageCreated(pageId: string) {
    this._handlePageIndexing(pageId, this._getPage(pageId));
  }

  search(query: QueryContent) {
    return new Map(
      this._search(query).flatMap(({ result }) =>
        result.map(r => [r.id, r.doc.space])
      )
    );
  }

  private _search(query: QueryContent): SearchResults[] {
    if (typeof query === 'object') {
      return this._indexer.search({
        ...query,
        enrich: true,
      }) as unknown as SearchResults[];
    } else {
      return this._indexer.search(query, {
        enrich: true,
      }) as unknown as SearchResults[];
    }
  }

  private _handlePageIndexing(pageId: string, page?: YMap<YBlock>) {
    if (page) {
      page.forEach((_, key) => {
        this._refreshIndex(pageId, key, 'add', page.get(key));
      });

      page.observeDeep(events => {
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
            this._refreshIndex(pageId, key, action, page.get(key));
          });
        }
      });
    }
  }

  private _refreshIndex(
    page: string,
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
            this._indexer.add(id, {
              content,
              space: page,
              tags: [page],
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

  private _getPage(key: string): YMap<YBlock> | undefined {
    try {
      if (!key.startsWith('space:')) {
        key = `space:${key}`;
      }
      return this._doc.getMap(key);
    } catch (_) {
      return undefined;
    }
  }
}
