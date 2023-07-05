import { assertExists } from '@blocksuite/global/utils';
import { merge } from 'merge';
import { Awareness } from 'y-protocols/awareness.js';

import { AwarenessStore, type RawAwarenessState } from './awareness.js';
import type { BlobStorage } from './persistence/blob/types.js';
import type { DocProvider, DocProviderCreator } from './providers/type.js';
import type { Space } from './space.js';
import type { IdGenerator } from './utils/id-generator.js';
import {
  createAutoIncrementIdGenerator,
  createAutoIncrementIdGeneratorByClientId,
  nanoid,
  uuidv4,
} from './utils/id-generator.js';
import { serializeYDoc, yDocToJSXNode } from './utils/jsx.js';
import { BlockSuiteDoc } from './yjs/index.js';

export interface SerializedStore {
  [key: string]: {
    [key: string]: unknown;
  };
}

export enum Generator {
  /**
   * Default mode, generator for the unpredictable id
   */
  NanoID = 'nanoID',

  UUIDv4 = 'uuidV4',
  /**
   * This generator is trying to fix the real-time collaboration on debug mode.
   * This will make generator predictable and won't make conflict
   * @link https://docs.yjs.dev/api/faq#i-get-a-new-clientid-for-every-session-is-there-a-way-to-make-it-static-for-a-peer-accessing-the-doc
   */
  AutoIncrementByClientId = 'autoIncrementByClientId',
  /**
   * **Warning**: This generator mode will crash the collaborative feature
   *  if multiple clients are adding new blocks.
   * Use this mode only if you know what you're doing.
   */
  AutoIncrement = 'autoIncrement',
}

/**
 * @example
 *  const workspace = new Workspace({
 *    isSSR: typeof window === 'undefined'
 *  })
 */
export interface SSROptions {
  isSSR?: boolean;
}

export interface StoreOptions<
  Flags extends Record<string, unknown> = BlockSuiteFlags
> extends SSROptions {
  id: string;
  providerCreators?: DocProviderCreator[];
  awareness?: Awareness<RawAwarenessState<Flags>>;
  idGenerator?: Generator;
  defaultFlags?: Partial<Flags>;
  blobStorages?: ((id: string) => BlobStorage)[];
}

const flagsPreset = {
  enable_set_remote_flag: true,
  enable_drag_handle: true,
  enable_block_hub: true,
  enable_surface: true,
  enable_edgeless_toolbar: true,
  enable_slash_menu: true,

  enable_database: true,
  enable_database_filter: false,
  enable_page_tags: false,
  enable_toggle_block: false,
  enable_block_selection_format_bar: true,
  enable_linked_page: false,
  enable_bookmark_operation: false,
  enable_note_index: false,

  enable_note_cut: true,

  readonly: {},
} satisfies BlockSuiteFlags;

export class Store {
  readonly id: string;
  readonly doc: BlockSuiteDoc;
  readonly providers: DocProvider[] = [];
  readonly spaces = new Map<string, Space>();
  readonly awarenessStore: AwarenessStore;
  readonly idGenerator: IdGenerator;

  // TODO: The user cursor should be spread by the spaceId in awareness
  constructor(
    {
      id,
      providerCreators = [],
      awareness,
      idGenerator,
      defaultFlags,
    }: StoreOptions = { id: nanoid() }
  ) {
    this.id = id;
    this.doc = new BlockSuiteDoc({ guid: id });
    this.awarenessStore = new AwarenessStore(
      this,
      awareness ?? new Awareness<RawAwarenessState>(this.doc),
      merge(true, flagsPreset, defaultFlags)
    );

    switch (idGenerator) {
      case Generator.AutoIncrement: {
        this.idGenerator = createAutoIncrementIdGenerator();
        break;
      }
      case Generator.AutoIncrementByClientId: {
        this.idGenerator = createAutoIncrementIdGeneratorByClientId(
          this.doc.clientID
        );
        break;
      }
      case Generator.UUIDv4: {
        this.idGenerator = uuidv4;
        break;
      }
      case Generator.NanoID:
      default: {
        this.idGenerator = nanoid;
        break;
      }
    }

    this.providers = providerCreators.map(creator =>
      creator(id, this.doc, {
        awareness: this.awarenessStore.awareness,
      })
    );
  }

  addSpace(space: Space) {
    this.spaces.set(space.prefixedId, space);
  }

  removeSpace(space: Space) {
    this.spaces.delete(space.prefixedId);
  }

  /**
   * @internal Only for testing, 'page0' should be replaced by props 'spaceId'
   */
  exportJSX(pageId: string, blockId?: string) {
    const prefixedPageId = pageId.startsWith('space:')
      ? pageId
      : `space:${pageId}`;
    const doc = this.doc.spaces.get(prefixedPageId);
    assertExists(doc);
    const pageJson = serializeYDoc(doc);
    if (!pageJson) {
      throw new Error(`Page ${pageId} doesn't exist`);
    }
    const blockJson = pageJson.blocks as Record<string, unknown>;
    if (!blockId) {
      const pageBlockId = Object.keys(blockJson).at(0);
      if (!pageBlockId) {
        return null;
      }
      blockId = pageBlockId;
    }
    if (!blockJson[blockId]) {
      return null;
    }
    return yDocToJSXNode(blockJson, blockId);
  }
}
