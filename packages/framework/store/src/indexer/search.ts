import type { DocumentSearchOptions } from 'flexsearch';
import type { Doc } from 'yjs';

import {
  IS_NODE,
  IS_WEB,
  REQUEST_IDLE_CALLBACK_ENABLED,
} from '@blocksuite/global/env';
import FlexSearch from 'flexsearch';
import { Text as YText } from 'yjs';

import type { YBlock } from '../store/doc/block/index.js';
import type { YBlocks } from '../store/doc/block-collection.js';
import type { BlockSuiteDoc } from '../yjs/index.js';

const DocumentIndexer = FlexSearch.Document;
const Index = FlexSearch.Index;

export type QueryContent = string | Partial<DocumentSearchOptions<boolean>>;

type SearchResult = { id: string; doc: { space: string; content: string } };
type SearchResults = { field: string; result: SearchResult[] };

function tokenize(locale: string) {
  const tokenizer = Intl.Segmenter;
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

type IndexMeta = Readonly<{
  content: string;
  reference?: string;
  space: string;
  tags: string[];
}>;

const REINDEX_TIMEOUT = 200;

export class SearchIndexer {
  private readonly _doc: BlockSuiteDoc;

  private readonly _indexer: FlexSearch.Document<IndexMeta, string[]>;

  private _reindex = () => {
    if (!this._reindexMap) return;

    for (const id of this._reindexMap.keys()) {
      const meta = this._reindexMap.get(id);
      if (meta) {
        this._reindexMap.delete(id);
        this._indexer.add(id, meta);
      }
    }

    setTimeout(() => {
      if (!this._reindexMap) return;
      if (REQUEST_IDLE_CALLBACK_ENABLED) {
        requestIdleCallback(this._reindex, { timeout: 1000 });
      } else {
        setTimeout(this._reindex, 1000);
      }
    }, REINDEX_TIMEOUT);
  };

  private _reindexMap: Map<string, IndexMeta> | null = null;

  constructor(
    doc: BlockSuiteDoc,
    // locale string based on https://www.w3.org/International/articles/bcp47/
    locale = 'en-US'
  ) {
    this._doc = doc;
    this._indexer = new DocumentIndexer<IndexMeta, string[]>({
      document: {
        id: 'id',
        index: ['content', 'reference', 'space'],
        tag: 'tags',
        store: ['space', 'content'],
      },
      encode: tokenize(locale),
      tokenize: 'forward',
      context: true,
    });
    this._reindexMap = new Map();
    this._reindex();

    // fixme(Mirone): use better way to listen to doc changes
    doc.spaces.observe(event => {
      event.keysChanged.forEach(docId => {
        const doc = this._getDoc(docId);
        if (doc != null) {
          this._handleDocIndexing(docId, doc);
        }
      });
    });

    if (IS_WEB) {
      window.addEventListener('beforeunload', () => {
        this._reindexMap = null;
      });
    }
    if (IS_NODE) {
      process.on('exit', () => {
        this._reindexMap = null;
      });
    }
  }

  private _getDoc(key: string): Doc | undefined {
    try {
      return this._doc.spaces.get(key);
    } catch (_) {
      return undefined;
    }
  }

  private _handleDocIndexing(docId: string, doc: Doc) {
    if (!doc) {
      return;
    }
    const yBlocks = doc.getMap('blocks') as YBlocks;
    this.refreshDocIndex(docId, doc);
    yBlocks.observeDeep(events => {
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
          this._refreshIndex(docId, key, action, yBlocks.get(key));
        });
      }
    });
  }

  private _refreshIndex(
    doc: string,
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
            this._reindexMap?.set(id, {
              content,
              space: doc,
              tags: [doc],
            });
          }
        }
        break;
      }
      case 'delete': {
        this._reindexMap?.delete(id);
        this._indexer.remove(id);
        break;
      }
    }
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

  refreshDocIndex(docId: string, doc: Doc) {
    const yBlocks = doc.getMap('blocks') as YBlocks;
    yBlocks.forEach((_, key) => {
      this._refreshIndex(docId, key, 'add', yBlocks.get(key));
    });
  }

  search(query: QueryContent) {
    return new Map(
      this._search(query).flatMap(({ result }) =>
        result.map(r => [r.id, { space: r.doc.space, content: r.doc.content }])
      )
    );
  }
}
