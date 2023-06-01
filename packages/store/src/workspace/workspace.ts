import { assertExists, Slot } from '@blocksuite/global/utils';
import * as Y from 'yjs';

import type { AwarenessStore } from '../awareness.js';
import type { BlockSchemaType } from '../base.js';
import { BlockSchema } from '../base.js';
import { createMemoryStorage } from '../persistence/blob/memory-storage.js';
import type { BlobManager, BlobStorage } from '../persistence/blob/types.js';
import { sha } from '../persistence/blob/utils.js';
import {
  type InlineSuggestionProvider,
  Store,
  type StoreOptions,
} from '../store.js';
import { serializeYDoc } from '../utils/jsx.js';
import { BacklinkIndexer } from './indexer/backlink.js';
import { BlockIndexer } from './indexer/base.js';
import { type QueryContent, SearchIndexer } from './indexer/search.js';
import { type PageMeta, WorkspaceMeta } from './meta.js';
import { Page } from './page.js';
import { Schema } from './schema.js';

export type WorkspaceOptions = {
  experimentalInlineSuggestionProvider?: InlineSuggestionProvider;
} & StoreOptions;

export class Workspace {
  static Y = Y;

  private _store: Store;

  private readonly _schema: Schema;
  private readonly _storages: BlobStorage[] = [];
  private readonly _blobStorage: BlobManager;

  meta: WorkspaceMeta;

  slots = {
    pagesUpdated: new Slot(),
    pageAdded: new Slot<string>(),
    pageRemoved: new Slot<string>(),
    // call this when a blob is updated, deleted or created
    //  workspace will update re-fetch the blob and update the page
    blobUpdate: new Slot<void>(),
  };

  indexer: {
    search: SearchIndexer;
    backlink: BacklinkIndexer;
  };

  readonly inlineSuggestionProvider?: InlineSuggestionProvider;

  constructor({
    experimentalInlineSuggestionProvider,
    ...storeOptions
  }: WorkspaceOptions) {
    this.inlineSuggestionProvider = experimentalInlineSuggestionProvider;
    this._schema = new Schema(this);

    this._store = new Store(storeOptions);

    this._storages = (storeOptions.blobStorages ?? [createMemoryStorage]).map(
      fn => fn(storeOptions.id)
    );

    this._blobStorage = {
      get: async id => {
        let found = false;
        let count = 0;
        return new Promise(res => {
          this._storages.forEach(storage =>
            storage.crud
              .get(id)
              .then(result => {
                if (result && !found) {
                  found = true;
                  res(result);
                }
                if (++count === this._storages.length && !found) {
                  res(null);
                }
              })
              .catch(e => {
                console.error(e);
                if (++count === this._storages.length && !found) {
                  res(null);
                }
              })
          );
        });
      },
      set: async value => {
        const key = await sha(await value.arrayBuffer());
        await Promise.all(this._storages.map(s => s.crud.set(key, value)));
        return key;
      },
      delete: async key => {
        await Promise.all(this._storages.map(s => s.crud.delete(key)));
      },
      list: async () => {
        const keys = new Set<string>();
        await Promise.all(
          this._storages.map(async s => {
            const list = await s.crud.list();
            list.forEach(key => keys.add(key));
          })
        );
        return Array.from(keys);
      },
    };

    this.meta = new WorkspaceMeta('space:meta', this.doc, this.awarenessStore);
    this._bindPageMetaEvents();

    const blockIndexer = new BlockIndexer(this.doc, { slots: this.slots });
    const backlinkIndexer = new BacklinkIndexer(blockIndexer);
    this.indexer = {
      search: new SearchIndexer(this.doc),
      backlink: backlinkIndexer,
    };

    // TODO use BlockIndexer
    this.slots.pageAdded.on(id => {
      // For potentially batch-added blocks, it's best to build index asynchronously
      queueMicrotask(() => this.indexer.search.onPageCreated(id));
    });
  }

  get id() {
    return this._store.id;
  }

  get isEmpty() {
    if (this.doc.store.clients.size === 0) return true;

    let flag = false;
    if (this.doc.store.clients.size === 1) {
      const items = [...this.doc.store.clients.values()][0];
      if (items.length <= 1) {
        flag = true;
      }
    }
    return flag;
  }

  get awarenessStore(): AwarenessStore {
    return this._store.awarenessStore;
  }

  get providers() {
    return this._store.providers;
  }

  get blobs() {
    return this._blobStorage;
  }

  private get _pages() {
    // the meta space is not included
    return this._store.spaces as Map<`space:${string}`, Page>;
  }

  public getPageNameList() {
    return [...this._pages.keys()];
  }

  get doc() {
    return this._store.doc;
  }

  get idGenerator() {
    return this._store.idGenerator;
  }

  get schema() {
    return this._schema;
  }

  register(blockSchema: BlockSchemaType[]) {
    blockSchema.forEach(schema => {
      BlockSchema.parse(schema);
      this.schema.flavourSchemaMap.set(schema.model.flavour, schema);
    });
    return this;
  }

  private _hasPage(pageId: string) {
    return this._pages.has(`space:${pageId}`);
  }

  getPage(pageId: string): Page | null {
    const prefixedPageId = pageId.startsWith('space:')
      ? (pageId as `space:${string}`)
      : (`space:${pageId}` as const);

    return this._pages.get(prefixedPageId) ?? null;
  }

  private _bindPageMetaEvents() {
    this.meta.pageMetaAdded.on(pageId => {
      const page = new Page({
        id: pageId,
        workspace: this,
        doc: this.doc,
        awarenessStore: this.awarenessStore,
        idGenerator: this._store.idGenerator,
      });
      this._store.addSpace(page);
      page.trySyncFromExistingDoc();
    });

    this.meta.pageMetasUpdated.on(() => this.slots.pagesUpdated.emit());

    this.meta.pageMetaRemoved.on(id => {
      const page = this.getPage(id) as Page;
      this._store.removeSpace(page);
      this.slots.pageRemoved.emit(id);
    });
  }

  /**
   * By default, only an empty page will be created.
   * If the `init` parameter is passed, a `surface`, `frame`, and `paragraph` block
   * will be created in the page simultaneously.
   */
  createPage(
    options: { id?: string; init?: true | { title: string } } | string = {}
  ) {
    // Migration guide
    if (typeof options === 'string') {
      options = { id: options };
      console.warn(
        '`createPage(pageId)` is deprecated, use `createPage()` directly or `createPage({ id: pageId })` instead'
      );
      console.warn(
        'More details see https://github.com/toeverything/blocksuite/pull/2272'
      );
    }
    // End of migration guide. Remove this in the next major version

    const { id: pageId = this.idGenerator(), init } = options;
    if (this._hasPage(pageId)) {
      throw new Error('page already exists');
    }

    this.meta.addPageMeta({
      id: pageId,
      title: '',
      createDate: +new Date(),
      subpageIds: [],
    });
    const page = this.getPage(pageId) as Page;

    let pageBlockId = pageId;
    if (init) {
      pageBlockId = page.addBlock(
        'affine:page',
        typeof init === 'boolean'
          ? undefined
          : {
              title: new page.Text(init.title),
            }
      );
      page.addBlock('affine:surface', {}, pageBlockId);
      const frameId = page.addBlock('affine:frame', {}, pageBlockId);
      page.addBlock('affine:paragraph', {}, frameId);
    }
    return page;
  }

  /** Update page meta state. Note that this intentionally does not mutate page state. */
  setPageMeta(
    pageId: string,
    // You should not update subpageIds directly.
    props: Partial<PageMeta>
  ) {
    this.meta.setPageMeta(pageId, props);
  }

  /**
   * @deprecated
   */
  shiftPage(pageId: string, newIndex: number) {
    this.meta.shiftPageMeta(pageId, newIndex);
  }

  removePage(pageId: string) {
    const pageMeta = this.meta.getPageMeta(pageId);
    assertExists(pageMeta);

    if (pageMeta.subpageIds.length) {
      // remove subpages first
      pageMeta.subpageIds.forEach((subpageId: string) => {
        if (subpageId === pageId) {
          console.error(
            'Unexpected subpage found when remove page! A page cannot be its own subpage',
            pageMeta
          );
          return;
        }
        this.removePage(subpageId);
      });
    }

    const page = this.getPage(pageId);
    if (!page) return;

    page.dispose();
    this.indexer.backlink.removeSubpageNode(this, pageId);
    this.meta.removePageMeta(pageId);
    this._store.removeSpace(page);
  }

  search(query: QueryContent) {
    return this.indexer.search.search(query);
  }

  /**
   * @internal Only for testing
   */
  exportYDoc() {
    const binary = Y.encodeStateAsUpdate(this.doc);
    const file = new Blob([binary], { type: 'application/octet-stream' });
    const fileUrl = URL.createObjectURL(file);

    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = 'workspace.ydoc';
    link.click();

    URL.revokeObjectURL(fileUrl);
  }

  /** @internal Only for testing */
  async importYDoc() {
    return new Promise<void>((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.ydoc';
      input.multiple = false;
      input.onchange = async () => {
        const file = input.files?.item(0);
        if (!file) {
          return reject();
        }
        const buffer = await file.arrayBuffer();
        Y.applyUpdate(this.doc, new Uint8Array(buffer));
        resolve();
      };
      input.onerror = reject;
      input.click();
    });
  }

  /** @internal Only for testing */
  importSnapshot() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any = {
      'space:meta': {
        pages: [
          {
            id: 'page0',
            title: 'Welcome to BlockSuite Playground',
            createDate: 1685558351082,
            subpageIds: [],
          },
        ],
        versions: {
          'affine:code': 1,
          'affine:paragraph': 1,
          'affine:page': 2,
          'affine:list': 1,
          'affine:frame': 1,
          'affine:divider': 1,
          'affine:embed': 1,
          'affine:surface': 3,
          'affine:bookmark': 1,
          'affine:database': 1,
        },
      },
      'space:page0': {
        '4266130717:0': {
          'sys:id': '4266130717:0',
          'sys:flavour': 'affine:page',
          'sys:children': ['4266130717:1', '4266130717:2'],
          'prop:title': [
            {
              insert: 'Welcome to BlockSuite Playground',
            },
          ],
        },
        '4266130717:1': {
          'sys:id': '4266130717:1',
          'sys:flavour': 'affine:surface',
          'sys:children': [],
          elements: {
            '0': {
              id: '0',
              index: 'a0',
              type: 'shape',
              xywh: '[0,-100,100,100]',
              seed: 1820170299,
              shapeType: 'rect',
              radius: 0,
              filled: false,
              fillColor: '--affine-palette-transparent',
              strokeWidth: 4,
              strokeColor: '--affine-palette-line-black',
              strokeStyle: 'solid',
              roughness: 2,
            },
          },
        },
        '4266130717:2': {
          'sys:id': '4266130717:2',
          'sys:flavour': 'affine:frame',
          'sys:children': [
            '4266130717:3',
            '4266130717:4',
            '4266130717:5',
            '4266130717:6',
            '4266130717:7',
            '4266130717:8',
            '4266130717:9',
            '4266130717:10',
            '4266130717:11',
            '4266130717:12',
            '4266130717:13',
          ],
          'prop:xywh': '[0,0,800,48]',
          'prop:background': '--affine-background-secondary-color',
          'prop:index': 'a0',
        },
        '4266130717:3': {
          'sys:id': '4266130717:3',
          'sys:flavour': 'affine:paragraph',
          'sys:children': [],
          'prop:type': 'text',
          'prop:text': [
            {
              insert: 'This playground is designed to:',
            },
          ],
        },
        '4266130717:4': {
          'sys:id': '4266130717:4',
          'sys:flavour': 'affine:list',
          'sys:children': [],
          'prop:type': 'bulleted',
          'prop:text': [
            {
              insert: '📝 Test basic editing experience.',
            },
          ],
          'prop:checked': false,
        },
        '4266130717:5': {
          'sys:id': '4266130717:5',
          'sys:flavour': 'affine:list',
          'sys:children': [],
          'prop:type': 'bulleted',
          'prop:text': [
            {
              insert: '⚙️ Serve as E2E test entry.',
            },
          ],
          'prop:checked': false,
        },
        '4266130717:6': {
          'sys:id': '4266130717:6',
          'sys:flavour': 'affine:list',
          'sys:children': [],
          'prop:type': 'bulleted',
          'prop:text': [
            {
              insert:
                '🔗 Demonstrate how BlockSuite reconciles real-time collaboration with ',
            },
            {
              insert: 'local-first',
              attributes: {
                link: 'https://martin.kleppmann.com/papers/local-first.pdf',
              },
            },
            {
              insert: ' data ownership.',
            },
          ],
          'prop:checked': false,
        },
        '4266130717:7': {
          'sys:id': '4266130717:7',
          'sys:flavour': 'affine:paragraph',
          'sys:children': [],
          'prop:type': 'h2',
          'prop:text': [
            {
              insert: 'Controlling Playground Data Source',
            },
          ],
        },
        '4266130717:8': {
          'sys:id': '4266130717:8',
          'sys:flavour': 'affine:paragraph',
          'sys:children': [],
          'prop:type': 'text',
          'prop:text': [
            {
              insert: 'You might initially enter this page with the ',
            },
            {
              insert: '?init',
              attributes: {
                code: true,
              },
            },
            {
              insert:
                ' URL param. This is the default (opt-in) setup that automatically loads this built-in article. Meanwhile, you\'ll connect to a random single-user room via a WebRTC provider by default. This is the "single-user mode" for local testing.',
            },
          ],
        },
        '4266130717:9': {
          'sys:id': '4266130717:9',
          'sys:flavour': 'affine:paragraph',
          'sys:children': [],
          'prop:type': 'text',
          'prop:text': [
            {
              insert:
                'To test real-time collaboration, you can specify the room to join by adding the ',
            },
            {
              insert: '?room=foo',
              attributes: {
                code: true,
              },
            },
            {
              insert: ' config - Try opening this page with ',
            },
            {
              insert: '?room=foo',
              attributes: {
                code: true,
              },
            },
            {
              insert: ' in two different tabs and see what happens!',
            },
          ],
        },
        '4266130717:10': {
          'sys:id': '4266130717:10',
          'sys:flavour': 'affine:paragraph',
          'sys:children': [],
          'prop:type': 'quote',
          'prop:text': [
            {
              insert:
                'Note that the second and subsequent users should not open the page with the ',
            },
            {
              insert: '?init',
              attributes: {
                code: true,
              },
            },
            {
              insert:
                ' param in this case. Also, due to the P2P nature of WebRTC, as long as there is at least one user connected to the room, the content inside the room will ',
            },
            {
              insert: 'always',
              attributes: {
                bold: true,
              },
            },
            {
              insert: ' exist.',
            },
          ],
        },
        '4266130717:11': {
          'sys:id': '4266130717:11',
          'sys:flavour': 'affine:paragraph',
          'sys:children': [],
          'prop:type': 'text',
          'prop:text': [
            {
              insert:
                'If you are the only user in the room, your content will be lost after refresh. This is great for local debugging. But if you want local persistence, you can open this page with the ',
            },
            {
              insert: '?providers=indexeddb&room=foo',
              attributes: {
                code: true,
              },
            },
            {
              insert:
                ' config, then click the init button in the bottom-left corner to initialize this default content.',
            },
          ],
        },
        '4266130717:12': {
          'sys:id': '4266130717:12',
          'sys:flavour': 'affine:paragraph',
          'sys:children': [],
          'prop:type': 'text',
          'prop:text': [
            {
              insert:
                'As a pro tip, you can combine multiple providers! For example, feel free to open this page with ',
            },
            {
              insert: '?providers=indexeddb,webrtc&room=hello',
              attributes: {
                code: true,
              },
            },
            {
              insert:
                ' params, and see if everything works as expected. Have fun!',
            },
          ],
        },
        '4266130717:13': {
          'sys:id': '4266130717:13',
          'sys:flavour': 'affine:paragraph',
          'sys:children': [],
          'prop:type': 'text',
          'prop:text': [
            {
              insert: 'For any feedback, please visit ',
            },
            {
              insert: 'BlockSuite issues',
              attributes: {
                link: 'https://github.com/toeverything/blocksuite/issues',
              },
            },
            {
              insert: ' 📍',
            },
          ],
        },
      },
    };

    if (!json['space:meta']) return;

    const unprefix = (str: string) =>
      str.replace('sys:', '').replace('prop:', '').replace('space:', '');

    const visited = new Set();

    const pageIds = Object.keys(json).filter(key => key !== 'space:meta');
    const firstPageBlocks = json[pageIds[0]];

    console.log(firstPageBlocks);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sanitize = (props: any) => {
      const result: Record<string, unknown> = {};
      Object.keys(props).forEach(key => {
        if (
          key === 'sys:children' ||
          // key === 'sys:id' ||
          key === 'sys:flavour'
        ) {
          return;
        }
        result[unprefix(key)] = props[key];
      });
      return result;
    };

    const addBlockByProps = (
      page: Page,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      props: any,
      parent: string | null
    ) => {
      const sanitizedProps = sanitize(props);
      page.addBlock(props['sys:flavour'], sanitizedProps, parent);
      for (const id of props['sys:children']) {
        if (visited.has(id)) continue;
        visited.add(id);
        addBlockByProps(page, firstPageBlocks[id], props['sys:id']);
      }
    };

    const importPage = (pageId: string) => {
      const page = this.createPage({ id: unprefix(pageId) });

      // const blockIds = Object.keys(firstPageBlocks);
      Object.values(firstPageBlocks).forEach(prefixedProps => {
        addBlockByProps(page, prefixedProps, null);
      });
    };

    importPage(pageIds[0]);
    // console.log(json);
  }

  /** @internal Only for testing */
  exportSnapshot() {
    return serializeYDoc(this.doc);
  }

  /** @internal Only for testing */
  exportJSX(blockId?: string, pageId = this.meta.pageMetas.at(0)?.id) {
    assertExists(pageId);
    return this._store.exportJSX(pageId, blockId);
  }
}
