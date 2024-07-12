import { WithDisposable } from '@blocksuite/block-std';
import { sha } from '@blocksuite/global/utils';
import {
  type DocCollection,
  type JobMiddleware,
  extMimeMap,
} from '@blocksuite/store';
import { Job } from '@blocksuite/store';
import JSZip from 'jszip';
import { LitElement, type PropertyValues, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import { MarkdownAdapter } from '../../../../_common/adapters/markdown.js';
import { NotionHtmlAdapter } from '../../../../_common/adapters/notion-html.js';
import '../../../../_common/components/loader.js';
import {
  CloseIcon,
  ExportToHTMLIcon,
  ExportToMarkdownIcon,
  HelpIcon,
  NewIcon,
  NotionIcon,
} from '../../../../_common/icons/index.js';
import { defaultImageProxyMiddleware } from '../../../../_common/transformers/middlewares.js';
import { openFileOrFiles } from '../../../../_common/utils/index.js';
import { styles } from './styles.js';

export type OnSuccessHandler = (
  pageIds: string[],
  options: { isWorkspaceFile: boolean; importedCount: number }
) => void;

export type OnFailHandler = (message: string) => void;

const SHOW_LOADING_SIZE = 1024 * 200;

export async function importMarkDown(
  collection: DocCollection,
  text: string,
  fileName?: string
) {
  const fileNameMiddleware: JobMiddleware = ({ slots }) => {
    slots.beforeImport.on(payload => {
      if (payload.type !== 'page') {
        return;
      }
      if (!fileName) {
        return;
      }
      payload.snapshot.meta.title = fileName;
      payload.snapshot.blocks.props.title = {
        '$blocksuite:internal:text$': true,
        delta: [
          {
            insert: fileName,
          },
        ],
      };
    });
  };
  const job = new Job({
    collection,
    middlewares: [defaultImageProxyMiddleware, fileNameMiddleware],
  });
  const mdAdapter = new MarkdownAdapter(job);
  const page = await mdAdapter.toDoc({
    file: text,
    assets: job.assetsManager,
  });
  return page.id;
}

export async function importHtml(collection: DocCollection, text: string) {
  const job = new Job({
    collection,
    middlewares: [defaultImageProxyMiddleware],
  });
  const htmlAdapter = new NotionHtmlAdapter(job);
  const snapshot = await htmlAdapter.toDocSnapshot({
    file: text,
    assets: job.assetsManager,
  });
  const page = await job.snapshotToDoc(snapshot);
  return page.id;
}

export async function importNotion(collection: DocCollection, file: File) {
  const pageIds: string[] = [];
  let isWorkspaceFile = false;
  let hasMarkdown = false;
  const parseZipFile = async (file: File | Blob) => {
    const zip = new JSZip();
    const zipFile = await zip.loadAsync(file);
    const pageMap = new Map<string, string>();
    const files = Object.keys(zipFile.files);
    const promises: Promise<void>[] = [];
    const pendingAssets = new Map<string, Blob>();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.startsWith('__MACOSX/')) continue;

      const lastSplitIndex = file.lastIndexOf('/');

      const fileName = file.substring(lastSplitIndex + 1);
      if (fileName.endsWith('.md')) {
        hasMarkdown = true;
        continue;
      }
      if (fileName.endsWith('.html')) {
        if (file.endsWith('/index.html')) {
          isWorkspaceFile = true;
          continue;
        }
        if (lastSplitIndex !== -1) {
          const text = await zipFile.files[file].async('text');
          const doc = new DOMParser().parseFromString(text, 'text/html');
          const pageBody = doc.querySelector('.page-body');
          if (pageBody && pageBody.children.length == 0) {
            // Skip empty pages
            continue;
          }
        }
        pageMap.set(file, collection.idGenerator());
        continue;
      }
      if (i === 0 && fileName.endsWith('.csv')) {
        window.open(
          'https://affine.pro/blog/import-your-data-from-notion-into-affine',
          '_blank'
        );
        continue;
      }
      if (fileName.endsWith('.zip')) {
        const innerZipFile = await zipFile.file(fileName)?.async('blob');
        if (innerZipFile) {
          promises.push(...(await parseZipFile(innerZipFile)));
        }
        continue;
      }
      const blob = await zipFile.files[file].async('blob');
      const ext = file.split('.').at(-1) ?? '';
      const mime = extMimeMap.get(ext) ?? '';
      pendingAssets.set(
        await sha(await blob.arrayBuffer()),
        new File([blob], fileName, { type: mime })
      );
    }
    const pagePromises = Array.from(pageMap.keys()).map(async file => {
      const job = new Job({
        collection: collection,
        middlewares: [defaultImageProxyMiddleware],
      });
      const htmlAdapter = new NotionHtmlAdapter(job);
      const assets = job.assetsManager.getAssets();
      for (const [key, value] of pendingAssets.entries()) {
        if (!assets.has(key)) {
          assets.set(key, value);
        }
      }
      const page = await htmlAdapter.toDoc({
        file: await zipFile.files[file].async('text'),
        pageId: pageMap.get(file),
        pageMap,
        assets: job.assetsManager,
      });
      pageIds.push(page.id);
    });
    promises.push(...pagePromises);
    return promises;
  };
  const allPromises = await parseZipFile(file);
  await Promise.all(allPromises.flat());
  return { pageIds, isWorkspaceFile, hasMarkdown };
}

@customElement('import-doc')
export class ImportDoc extends WithDisposable(LitElement) {
  static override styles = styles;

  constructor(
    private collection: DocCollection,
    private onSuccess?: OnSuccessHandler,
    private onFail?: OnFailHandler,
    private abortController = new AbortController()
  ) {
    super();

    this._loading = false;

    this.x = 0;
    this.y = 0;
    this._startX = 0;
    this._startY = 0;

    this._onMouseMove = this._onMouseMove.bind(this);
  }

  private async _importHtml() {
    const files = await openFileOrFiles({ acceptType: 'Html', multiple: true });
    if (!files) return;
    const pageIds: string[] = [];
    for (const file of files) {
      const text = await file.text();
      const needLoading = file.size > SHOW_LOADING_SIZE;
      if (needLoading) {
        this.hidden = false;
        this._loading = true;
      } else {
        this.abortController.abort();
      }
      const pageId = await importHtml(this.collection, text);
      needLoading && this.abortController.abort();
      pageIds.push(pageId);
    }
    this._onImportSuccess(pageIds);
  }

  private async _importMarkDown() {
    const files = await openFileOrFiles({
      acceptType: 'Markdown',
      multiple: true,
    });
    if (!files) return;
    const pageIds: string[] = [];
    for (const file of files) {
      const text = await file.text();
      const fileName = file.name.split('.').slice(0, -1).join('.');
      const needLoading = file.size > SHOW_LOADING_SIZE;
      if (needLoading) {
        this.hidden = false;
        this._loading = true;
      } else {
        this.abortController.abort();
      }
      const pageId = await importMarkDown(this.collection, text, fileName);
      needLoading && this.abortController.abort();
      pageIds.push(pageId);
    }
    this._onImportSuccess(pageIds);
  }

  private async _importNotion() {
    const file = await openFileOrFiles({ acceptType: 'Zip' });
    if (!file) return;
    // Calc size
    let totalSize = 0;
    const zip = new JSZip();
    const zipFile = await zip.loadAsync(file);
    const fileArray = Object.values(zipFile.files);
    for (const file of fileArray) {
      if (file.dir) continue;
      const fileContent = await file.async('uint8array');
      totalSize += fileContent.length;
    }
    const needLoading = totalSize > SHOW_LOADING_SIZE;
    if (needLoading) {
      this.hidden = false;
      this._loading = true;
    } else {
      this.abortController.abort();
    }
    const { pageIds, isWorkspaceFile, hasMarkdown } = await importNotion(
      this.collection,
      file
    );
    needLoading && this.abortController.abort();
    if (hasMarkdown) {
      this._onFail(
        'Importing markdown files from Notion is deprecated. Please export your Notion pages as HTML.'
      );
      return;
    }
    this._onImportSuccess([pageIds[0]], {
      isWorkspaceFile,
      importedCount: pageIds.length,
    });
  }

  private _onCloseClick(event: MouseEvent) {
    event.stopPropagation();
    this.abortController.abort();
  }

  private _onFail(message: string) {
    this.onFail?.(message);
  }

  private _onImportSuccess(
    pageIds: string[],
    options: { isWorkspaceFile?: boolean; importedCount?: number } = {}
  ) {
    const {
      isWorkspaceFile = false,
      importedCount: pagesImportedCount = pageIds.length,
    } = options;
    this.onSuccess?.(pageIds, {
      isWorkspaceFile,
      importedCount: pagesImportedCount,
    });
  }

  private _onMouseDown(event: MouseEvent) {
    this._startX = event.clientX - this.x;
    this._startY = event.clientY - this.y;
    window.addEventListener('mousemove', this._onMouseMove);
  }

  private _onMouseMove(event: MouseEvent) {
    this.x = event.clientX - this._startX;
    this.y = event.clientY - this._startY;
  }

  private _onMouseUp() {
    window.removeEventListener('mousemove', this._onMouseMove);
  }

  private _openLearnImportLink(event: MouseEvent) {
    event.stopPropagation();
    window.open(
      'https://affine.pro/blog/import-your-data-from-notion-into-affine',
      '_blank'
    );
  }

  override render() {
    if (this._loading) {
      return html`
        <div class="overlay-mask"></div>
        <div class="container">
          <header
            class="loading-header"
            @mousedown="${this._onMouseDown}"
            @mouseup="${this._onMouseUp}"
          >
            <div>Import</div>
            <loader-element .width=${'50px'}></loader-element>
          </header>
          <div>
            Importing the file may take some time. It depends on document size
            and complexity.
          </div>
        </div>
      `;
    }
    return html`
      <div
        class="overlay-mask"
        @click="${() => this.abortController.abort()}"
      ></div>
      <div class="container">
        <header @mousedown="${this._onMouseDown}" @mouseup="${this._onMouseUp}">
          <icon-button height="28px" @click="${this._onCloseClick}">
            ${CloseIcon}
          </icon-button>
          <div>Import</div>
        </header>
        <div>
          AFFiNE will gradually support more file formats for import.
          <a
            href="https://community.affine.pro/c/feature-requests/import-export"
            target="_blank"
            >Provide feedback.</a
          >
        </div>
        <div class="button-container">
          <icon-button
            class="button-item"
            text="Markdown"
            @click="${this._importMarkDown}"
          >
            ${ExportToMarkdownIcon}
          </icon-button>
          <icon-button
            class="button-item"
            text="HTML"
            @click="${this._importHtml}"
          >
            ${ExportToHTMLIcon}
          </icon-button>
        </div>
        <div class="button-container">
          <icon-button
            class="button-item"
            text="Notion"
            @click="${this._importNotion}"
          >
            ${NotionIcon}
            <div
              slot="suffix"
              class="button-suffix"
              @click="${this._openLearnImportLink}"
            >
              ${HelpIcon}
              <affine-tooltip>
                Learn how to Import your Notion pages into AFFiNE.
              </affine-tooltip>
            </div>
          </icon-button>
          <icon-button class="button-item" text="Coming soon..." disabled>
            ${NewIcon}
          </icon-button>
        </div>
        <!-- <div class="footer">
        <div>Migrate from other versions of AFFiNE?</div>
      </div> -->
      </div>
    `;
  }

  override updated(changedProps: PropertyValues) {
    if (changedProps.has('x') || changedProps.has('y')) {
      this.containerEl.style.transform = `translate(${this.x}px, ${this.y}px)`;
    }
  }

  @state()
  accessor _loading = false;

  @state()
  accessor _startX = 0;

  @state()
  accessor _startY = 0;

  @query('.container')
  accessor containerEl!: HTMLElement;

  @state()
  accessor x = 0;

  @state()
  accessor y = 0;
}
