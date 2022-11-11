import { PrefixedBlockProps, Space } from './space';
import type { IdGenerator } from './utils/id-generator';
import { Awareness } from 'y-protocols/awareness.js';
import * as Y from 'yjs';
import type { SyncProvider, SyncProviderConstructor } from './providers';
import { serializeYDoc, yDocToJSXNode } from './utils/jsx';
import { uuidv4 } from './utils/id-generator';
import type { BlobInput, BlobRef } from './blob-storage/blob-storage-types';
import { Ability } from './ability-type';

export interface SerializedStore {
  page0: {
    [key: string]: PrefixedBlockProps;
  };
}

/**
 * Progress -1/10:
 *
 * It's nice that this is simple, but I think we need to allow the embedder
 * more control for uploading, upload progress, upload failure, etc...
 *
 * Perhaps the embedder could even have controls for previewing before accepting...
 */
export type StoreOptionsHandleUploadRequest = (displayOptions: {
  promptText: string;
}) => Promise<null | BlobInput>;

export interface StoreOptions {
  room?: string;
  providers?: SyncProviderConstructor[];
  awareness?: Awareness;
  idGenerator?: IdGenerator;
  /**
   * Enable uploads by specifying how we're going to ask the user for an upload.
   *
   * @return `null` on user dismissed upload.
   *
   * Progress 1/10:
   *
   *  * Introduced to address only blob storage needs, so it might be overly limited.
   *    * For example, should this layer also know about the applicable file types?
   *  * Good that this creates a nice separation between the store and UI.
   *  * Good that I like the simplicity of this interface and ease of implementation.
   *  * Good that Store can accept uploads headless (for testing or maybe from server).
   *
   *  * Consider multiple file upload being a different option.
   */
  handleUploadRequest?: StoreOptionsHandleUploadRequest;
}

const DEFAULT_ROOM = 'virgo-default';

export type StoreUploadAbility = Ability<{
  prompt(promptText: string): Promise<null | BlobRef>;
}>;

export class Store {
  readonly doc = new Y.Doc();
  readonly providers: SyncProvider[] = [];
  readonly spaces = new Map<string, Space>();
  readonly awareness: Awareness;
  readonly idGenerator: IdGenerator;
  readonly uploads: StoreUploadAbility;

  constructor({
    room = DEFAULT_ROOM,
    providers = [],
    awareness,
    idGenerator,
    handleUploadRequest,
  }: StoreOptions = {}) {
    this.awareness = awareness ?? new Awareness(this.doc);
    this.idGenerator = idGenerator ?? uuidv4;
    this.providers = providers.map(
      ProviderConstructor =>
        new ProviderConstructor(room, this.doc, { awareness: this.awareness })
    );
    const uploadStorages = this.providers.flatMap(p =>
      p.blobStorage != null ? [p.blobStorage] : []
    );
    this.uploads =
      handleUploadRequest == null
        ? Ability.disabled(
            'Store was not configured with a way to show an upload interface.'
          )
        : uploadStorages.length === 0
        ? Ability.disabled(
            'None of the configured sync providers provide a way to store uploads.'
          )
        : {
            enabled: true,
            async prompt(promptText) {
              const promptResult = await handleUploadRequest({
                promptText,
              });
              if (promptResult == null) {
                return null;
              }
              const results = await Promise.all(
                uploadStorages.map(a => a.upload(promptResult))
              );
              if (results.length !== 1) {
                throw new Error(
                  `InternalError: Unable to create single BlobRef after being uploaded to ${results.length} locations.`
                );
              }
              return results[0];
            },
          };
  }

  getSpace(spaceId: string) {
    return this.spaces.get(spaceId) as Space;
  }

  // TODO: The user cursor should be spread by the spaceId in awareness
  createSpace(spaceId: string) {
    this.spaces.set(
      spaceId,
      new Space({
        doc: this.doc,
        awareness: this.awareness,
        blobs: {
          // avert your eyes!
          storage: this.providers.flatMap(p =>
            p.blobStorage != null ? [p.blobStorage] : []
          )[0],
          uploads: this.uploads,
        },
        idGenerator: this.idGenerator,
      })
    );
    return this.getSpace(spaceId);
  }

  /**
   * @internal Only for testing at now
   */
  serializeDoc() {
    return serializeYDoc(this.doc) as unknown as SerializedStore;
  }

  /**
   * @internal Only for testing at now
   */
  toJSXElement(id = '0') {
    const json = this.serializeDoc();
    if (!('page0' in json)) {
      throw new Error("Failed to convert to JSX: 'page0' not found");
    }
    if (!json.page0[id]) {
      return null;
    }
    return yDocToJSXNode(json.page0, id);
  }
}
