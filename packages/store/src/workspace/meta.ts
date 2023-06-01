import { assertExists, Slot } from '@blocksuite/global/utils';
import type * as Y from 'yjs';

import type { BlockSuiteDoc } from '../yjs/index.js';
import type { Workspace } from './workspace.js';

// please use `declare module '@blocksuite/store'` to extend this interface
export interface PageMeta {
  id: string;
  title: string;
  createDate: number;
}

type WorkspaceMetaState = {
  pages?: unknown[];
  blockVersions?: Record<string, number>;
  name?: string;
  avatar?: string;
};

export class WorkspaceMeta {
  readonly id: string = 'meta';
  readonly doc: BlockSuiteDoc;

  private _prevPages = new Set<string>();

  pageMetaAdded = new Slot<string>();
  pageMetaRemoved = new Slot<string>();
  pageMetasUpdated = new Slot();
  commonFieldsUpdated = new Slot();

  protected readonly _yMap: Y.Map<WorkspaceMetaState[keyof WorkspaceMetaState]>;
  protected readonly _proxy: WorkspaceMetaState;

  constructor(doc: BlockSuiteDoc) {
    this.doc = doc;
    this._yMap = doc.getMap(this.id);
    this._proxy = doc.getMapProxy<string, WorkspaceMetaState>(this.id, {
      deep: true,
    });
    this._yMap.observeDeep(this._handleWorkspaceMetaEvents);
  }

  get yPages() {
    return this._yMap.get('pages') as unknown as Y.Array<unknown>;
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
    return [...(this._proxy.pages as PageMeta[])] ?? ([] as PageMeta[]);
  }

  getPageMeta(id: string) {
    return this.pageMetas.find(page => page.id === id);
  }

  addPageMeta(page: PageMeta, index?: number) {
    this.doc.transact(() => {
      if (!this.pages) {
        this._proxy.pages = [];
      }
      const pages = this.pages as unknown[];
      if (index === undefined) {
        pages.push(page);
      } else {
        pages.splice(index, 0, page);
      }
    });
  }

  /**
   * @internal Use {@link Workspace.setPageMeta} instead
   */
  setPageMeta(id: string, props: Partial<PageMeta>) {
    const pages = (this.pages as PageMeta[]) ?? [];
    const index = pages.findIndex((page: PageMeta) => id === page.id);

    this.doc.transact(() => {
      if (!this.pages) {
        this._proxy.pages = [];
      }
      if (index === -1) return;
      assertExists(this.pages);

      const page = this.pages[index] as Record<string, unknown>;
      Object.entries(props).forEach(([key, value]) => {
        page[key] = value;
      });
    });
  }

  removePageMeta(id: string) {
    // you cannot delete a page if there's no page
    assertExists(this.pages);
    const pageMetas = this.pageMetas as PageMeta[];
    const index = pageMetas.findIndex((page: PageMeta) => id === page.id);
    if (index === -1) {
      return;
    }
    this.doc.transact(() => {
      assertExists(this.pages);
      this.pages.splice(index, 1);
    });
  }

  /**
   * @internal Only for page initialization
   */
  writeVersion(workspace: Workspace) {
    const versions = this._proxy.blockVersions;
    if (!versions) {
      const _versions: Record<string, number> = {};
      workspace.schema.flavourSchemaMap.forEach((schema, flavour) => {
        _versions[flavour] = schema.version;
      });
      this._proxy.blockVersions = _versions;
      return;
    } else {
      console.error(`Workspace versions already set.`);
    }
  }

  /**
   * @internal Only for page initialization
   */
  validateVersion(workspace: Workspace) {
    const versions = { ...this._proxy.blockVersions };
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
      // this.doc.getMap('space:' + pageMeta.id);

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
        e.target === this._yMap && e.changes.keys.has(k);

      if (
        e.target === this.yPages ||
        e.target.parent === this.yPages ||
        hasKey('pages')
      ) {
        this._handlePageMetaEvent();
      }

      if (hasKey('name') || hasKey('avatar')) {
        this._handleCommonFieldsEvent();
      }
    });
  };
}
