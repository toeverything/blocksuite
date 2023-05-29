import { assertExists, Slot } from '@blocksuite/global/utils';
import * as Y from 'yjs';

import type { AwarenessStore } from '../awareness.js';
import { Space } from '../space.js';
import { type InlineSuggestionProvider, type StoreOptions } from '../store.js';
import type { BlockSuiteDoc } from '../yjs/index.js';
import type { Workspace } from './workspace.js';

export type PageSource =
  | ''
  | 'importFromMarkdown'
  | 'importFromHtml'
  | 'importFromNotion';

export type WorkspaceOptions = {
  experimentalInlineSuggestionProvider?: InlineSuggestionProvider;
} & StoreOptions;

export interface PageMeta {
  id: string;
  title: string;
  createDate: number;
  /**
   * Note: YOU SHOULD NOT UPDATE THIS FIELD MANUALLY.
   * @deprecated
   */
  subpageIds: string[];
  // please use `declare module '@blocksuite/store'` to extend this interface

  source: PageSource;
}

type WorkspaceMetaState = {
  pages?: Y.Array<unknown>;
  versions?: Y.Map<unknown>;
  name?: string;
  avatar?: string;
};

export class WorkspaceMeta extends Space<WorkspaceMetaState> {
  private _prevPages = new Set<string>();
  pageMetaAdded = new Slot<string>();
  pageMetaRemoved = new Slot<string>();
  pageMetasUpdated = new Slot();
  commonFieldsUpdated = new Slot();

  constructor(id: string, doc: BlockSuiteDoc, awarenessStore: AwarenessStore) {
    super(id, doc, awarenessStore);
    this._ySpace.observeDeep(this._handleWorkspaceMetaEvents);
  }

  get pages() {
    return this._proxy.pages;
  }

  get name() {
    return this._proxy.name;
  }

  get avatar() {
    return this._proxy.avatar;
  }

  setName(name: string) {
    this.doc.transact(() => {
      this._proxy.name = name;
    });
  }

  setAvatar(avatar: string) {
    this.doc.transact(() => {
      this._proxy.avatar = avatar;
    });
  }

  get pageMetas() {
    return (this._proxy.pages?.toJSON() as PageMeta[]) ?? ([] as PageMeta[]);
  }

  getPageMeta(id: string) {
    return this.pageMetas.find(page => page.id === id);
  }

  addPageMeta(page: PageMeta, index?: number) {
    this.doc.transact(() => {
      const pages: Y.Array<unknown> = this.pages ?? new Y.Array();
      const yPage = this._transformObjectToYMap(page);
      if (index === undefined) {
        pages.push([yPage]);
      } else {
        pages.insert(index, [yPage]);
      }
      if (!this.pages) {
        this._ySpace.set('pages', pages);
      }
    });
  }

  /**
   * @internal Use {@link Workspace.setPageMeta} instead
   */
  setPageMeta(id: string, props: Partial<PageMeta>) {
    const pages = (this.pages?.toJSON() as PageMeta[]) ?? [];
    const index = pages.findIndex((page: PageMeta) => id === page.id);

    this.doc.transact(() => {
      if (!this.pages) {
        this._ySpace.set('pages', new Y.Array());
      }
      if (index === -1) return;
      assertExists(this.pages);

      const yPage = this.pages.get(index) as Y.Map<unknown>;
      Object.entries(props).forEach(([key, value]) => {
        yPage.set(key, value);
      });
    });
  }

  /**
   * Adjust the index of a page inside the pageMetss list
   *
   * @deprecated
   */
  shiftPageMeta(pageId: string, newIndex: number) {
    const pageMetas = (this.pages ?? new Y.Array()).toJSON() as PageMeta[];
    const index = pageMetas.findIndex((page: PageMeta) => pageId === page.id);

    if (index === -1) return;

    const yPage = this._transformObjectToYMap(pageMetas[index]);

    this.doc.transact(() => {
      assertExists(this.pages);
      this.pages.delete(index, 1);
      if (newIndex > this.pages.length) {
        this.pages.push([yPage]);
      } else {
        this.pages.insert(newIndex, [yPage]);
      }
    });
  }

  removePageMeta(id: string) {
    // you cannot delete a page if there's no page
    assertExists(this.pages);
    const pageMetas = this.pages.toJSON() as PageMeta[];
    const index = pageMetas.findIndex((page: PageMeta) => id === page.id);
    if (index === -1) {
      return;
    }
    this.doc.transact(() => {
      assertExists(this.pages);
      this.pages.delete(index, 1);
    });
  }

  /**
   * @internal Only for page initialization
   */
  writeVersion(workspace: Workspace) {
    let versions = this._proxy.versions;
    if (!versions) {
      versions = new Y.Map<unknown>();
      workspace.schema.flavourSchemaMap.forEach((schema, flavour) => {
        (versions as Y.Map<unknown>).set(flavour, schema.version);
      });
      this._ySpace.set('versions', versions);
      return;
    } else {
      console.error(`Workspace versions already set.`);
    }
  }

  /**
   * @internal Only for page initialization
   */
  validateVersion(workspace: Workspace) {
    const versions = this._proxy.versions?.toJSON();
    if (!versions) {
      throw new Error(
        'Invalid workspace data, versions data is missing. Please make sure the data is valid'
      );
    }
    const dataFlavours = Object.keys(versions);
    // TODO: emit data validation error slots
    if (dataFlavours.length === 0) {
      throw new Error(
        'Invalid workspace data, missing versions field. Please make sure the data is valid.'
      );
    }

    dataFlavours.forEach(dataFlavour => {
      const dataVersion = versions[dataFlavour] as number;
      const editorVersion =
        workspace.schema.flavourSchemaMap.get(dataFlavour)?.version;
      if (!editorVersion) {
        throw new Error(
          `Editor missing ${dataFlavour} flavour. Please make sure this block flavour is registered.`
        );
      } else if (dataVersion > editorVersion) {
        throw new Error(
          `Editor doesn't support ${dataFlavour}@${dataVersion}. Please upgrade the editor.`
        );
      } else if (dataVersion < editorVersion) {
        throw new Error(
          `In workspace data, the block flavour ${dataFlavour}@${dataVersion} is outdated. Please downgrade the editor or try data migration.`
        );
      }
    });
  }

  private _handlePageMetaEvent() {
    const { pageMetas, _prevPages } = this;

    pageMetas.forEach(pageMeta => {
      // newly added space can't be found
      // unless explicitly getMap after meta updated
      this.doc.getMap('space:' + pageMeta.id);

      if (!_prevPages.has(pageMeta.id)) {
        this.pageMetaAdded.emit(pageMeta.id);
      }
    });

    _prevPages.forEach(prevPageId => {
      const isRemoved = !pageMetas.find(p => p.id === prevPageId);
      if (isRemoved) {
        this.pageMetaRemoved.emit(prevPageId);
      }
    });

    _prevPages.clear();
    pageMetas.forEach(page => _prevPages.add(page.id));

    this.pageMetasUpdated.emit();
  }

  private _handleCommonFieldsEvent() {
    this.commonFieldsUpdated.emit();
  }

  private _handleWorkspaceMetaEvents = (
    events: Y.YEvent<Y.Array<unknown> | Y.Text | Y.Map<unknown>>[]
  ) => {
    events.forEach(e => {
      const hasKey = (k: string) =>
        e.target === this._ySpace && e.changes.keys.has(k);

      if (
        e.target === this.pages ||
        e.target.parent === this.pages ||
        hasKey('pages')
      ) {
        this._handlePageMetaEvent();
      }

      if (hasKey('name') || hasKey('avatar')) {
        this._handleCommonFieldsEvent();
      }
    });
  };

  private _transformObjectToYMap<T extends object>(obj: T): Y.Map<T[keyof T]> {
    const yMap: Y.Map<T[keyof T]> = new Y.Map();
    Object.entries(obj).forEach(([key, value]) => {
      yMap.set(key, value as T[keyof T]);
    });
    return yMap;
  }
}
