import '../../../../_common/components/loader.js';

import { WithDisposable } from '@blocksuite/lit';
import { type Workspace } from '@blocksuite/store';
import { Job } from '@blocksuite/store';
import JSZip from 'jszip';
import { html, LitElement, type PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import { MarkdownAdapter } from '../../../../_common/adapters/markdown.js';
import { NotionHtmlAdapter } from '../../../../_common/adapters/notion-html.js';
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
  isWorkspaceFile: boolean
) => void;

const SHOW_LOADING_SIZE = 1024 * 200;

export async function importMarkDown(workspace: Workspace, text: string) {
  const job = new Job({
    workspace: workspace,
    middlewares: [defaultImageProxyMiddleware],
  });
  const mdAdapter = new MarkdownAdapter();
  mdAdapter.applyConfigs(job.adapterConfigs);
  const snapshot = await mdAdapter.toPageSnapshot({ file: text });
  const page = await job.snapshotToPage(snapshot);
  return [page.id];
}

export async function importHtml(workspace: Workspace, text: string) {
  const job = new Job({
    workspace: workspace,
    middlewares: [defaultImageProxyMiddleware],
  });
  const htmlAdapter = new NotionHtmlAdapter();
  htmlAdapter.applyConfigs(job.adapterConfigs);
  const snapshot = await htmlAdapter.toPageSnapshot({ file: text });
  const page = await job.snapshotToPage(snapshot);
  return [page.id];
}

export async function importNotion(workspace: Workspace, file: File) {
  const pageIds: string[] = [];
  let isWorkspaceFile = false;
  const parseZipFile = async (file: File | Blob) => {
    const zip = new JSZip();
    const zipFile = await zip.loadAsync(file);
    const pageMap = new Map<string, string>();
    const files = Object.keys(zipFile.files);
    const promises: Promise<void>[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.startsWith('__MACOSX/')) continue;

      const lastSplitIndex = file.lastIndexOf('/');

      const fileName = file.substring(lastSplitIndex + 1);
      if (fileName.endsWith('.html') || fileName.endsWith('.md')) {
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
        pageMap.set(file, workspace.idGenerator('page'));
      }
      if (i === 0 && fileName.endsWith('.csv')) {
        window.open(
          'https://affine.pro/blog/import-your-data-from-notion-into-affine',
          '_blank'
        );
      }
      if (fileName.endsWith('.zip')) {
        const innerZipFile = await zipFile.file(fileName)?.async('blob');
        if (innerZipFile) {
          promises.push(...(await parseZipFile(innerZipFile)));
        }
      }
    }
    const pagePromises = Array.from(pageMap.keys()).map(async file => {
      const job = new Job({
        workspace: workspace,
        middlewares: [defaultImageProxyMiddleware],
      });
      const htmlAdapter = new NotionHtmlAdapter();
      htmlAdapter.applyConfigs(job.adapterConfigs);
      const snapshot = await htmlAdapter.toPageSnapshot({
        file: await zipFile.files[file].async('text'),
        pageId: pageMap.get(file),
        pageMap,
      });
      const page = await job.snapshotToPage(snapshot);
      pageIds.push(page.id);
    });
    promises.push(...pagePromises);
    return promises;
  };
  const allPromises = await parseZipFile(file);
  await Promise.all(allPromises.flat());
  return { pageIds, isWorkspaceFile };
}

/**
 * @deprecated Waiting for migration
 * See https://github.com/toeverything/blocksuite/issues/3316
 */
@customElement('import-doc')
export class ImportDoc extends WithDisposable(LitElement) {
  static override styles = styles;

  @state()
  _loading = false;

  @state()
  x = 0;

  @state()
  y = 0;

  @state()
  _startX = 0;

  @state()
  _startY = 0;

  @query('.container')
  containerEl!: HTMLElement;

  constructor(
    private workspace: Workspace,
    private onSuccess?: OnSuccessHandler,
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

  override updated(changedProps: PropertyValues) {
    if (changedProps.has('x') || changedProps.has('y')) {
      this.containerEl.style.transform = `translate(${this.x}px, ${this.y}px)`;
    }
  }

  private _onMouseDown(event: MouseEvent) {
    this._startX = event.clientX - this.x;
    this._startY = event.clientY - this.y;
    window.addEventListener('mousemove', this._onMouseMove);
  }

  private _onMouseUp() {
    window.removeEventListener('mousemove', this._onMouseMove);
  }

  private _onMouseMove(event: MouseEvent) {
    this.x = event.clientX - this._startX;
    this.y = event.clientY - this._startY;
  }

  private _onCloseClick(event: MouseEvent) {
    event.stopPropagation();
    this.abortController.abort();
  }

  private _onImportSuccess(pageIds: string[], isWorkspaceFile = false) {
    this.onSuccess?.(pageIds, isWorkspaceFile);
  }

  private async _importMarkDown() {
    const file = await openFileOrFiles({ acceptType: 'Markdown' });
    if (!file) return;
    const text = await file.text();
    const needLoading = file.size > SHOW_LOADING_SIZE;
    if (needLoading) {
      this.hidden = false;
      this._loading = true;
    } else {
      this.abortController.abort();
    }
    const pageIds = await importMarkDown(this.workspace, text);
    needLoading && this.abortController.abort();
    this._onImportSuccess(pageIds);
  }

  private async _importHtml() {
    const file = await openFileOrFiles({ acceptType: 'Html' });
    if (!file) return;
    const text = await file.text();
    const needLoading = file.size > SHOW_LOADING_SIZE;
    if (needLoading) {
      this.hidden = false;
      this._loading = true;
    } else {
      this.abortController.abort();
    }
    const pageIds = await importHtml(this.workspace, text);
    needLoading && this.abortController.abort();
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
    const { pageIds, isWorkspaceFile } = await importNotion(
      this.workspace,
      file
    );
    needLoading && this.abortController.abort();
    this._onImportSuccess(pageIds, isWorkspaceFile);
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
        <div class="overlay-mask blocksuite-overlay"></div>
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
        class="overlay-mask blocksuite-overlay"
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
}
