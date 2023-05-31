import '../loader.js';

import {
  CloseIcon,
  ExportToHTMLIcon,
  ExportToMarkdownIcon,
  HelpIcon,
  NewIcon,
  NotionIcon,
} from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import type { Page, Workspace } from '@blocksuite/store';
import JSZip from 'jszip';
import { html, LitElement, type PropertyValues } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { ContentParser } from '../../__internal__/content-parser/index.js';
import { toast } from '../toast.js';
import { styles } from './styles.js';

export type OnSuccessHandler = (pageIds: string[]) => void;

const LINK_PRE = 'Affine-LinkedPage-';
const SHOW_LOADING_SIZE = 1024 * 200;

@customElement('import-page')
export class ImportPage extends WithDisposable(LitElement) {
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

  constructor(
    private workspace: Workspace,
    private multiple: boolean,
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

  loading(): boolean {
    return this._loading;
  }

  override updated(changedProps: PropertyValues) {
    if (changedProps.has('x') || changedProps.has('y')) {
      this.style.transform = `translate(${this.x}px, ${this.y}px)`;
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

  private async _selectFile(accept: string): Promise<File[]> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = this.multiple;
    input.click();
    return new Promise((resolve, reject) => {
      input.onchange = () => {
        const files = input.files;
        if (!files) {
          reject();
          return;
        }
        resolve(Array.from(files));
      };
      input.onerror = () => {
        reject();
      };
    });
  }

  private _onImportSuccess(pageIds: string[]) {
    toast(
      `Successfully imported ${pageIds.length} Page${
        pageIds.length > 1 ? 's' : ''
      }.`
    );
    this.onSuccess?.(pageIds);
  }

  private async _importFile(
    fileExtension: string,
    needLoadingHandler: (files: File[]) => Promise<boolean>,
    parseContentHandler: (file: File) => Promise<string[]>
  ) {
    this.hidden = true;
    const files = await this._selectFile(fileExtension);
    const needLoading = await needLoadingHandler(files);
    if (needLoading) {
      this.hidden = false;
      this._loading = true;
    } else {
      this.abortController.abort();
    }

    const pageIds: string[] = [];
    for (const file of files) {
      const importPageIds = await parseContentHandler(file);
      pageIds.push(...importPageIds);
    }
    this._onImportSuccess(pageIds);

    needLoading && this.abortController.abort();
  }

  private async _importMarkDown() {
    await this._importFile(
      '.md',
      async files => {
        let totalSize = 0;
        for (const file of files) {
          totalSize += file.size;
          if (totalSize > SHOW_LOADING_SIZE) return true;
        }
        return false;
      },
      async file => {
        const text = await file.text();
        const page = this.workspace.createPage({
          init: {
            title: '',
          },
        });
        const rootId = page.root?.id;
        const contentParser = new ContentParser(page);
        if (rootId) {
          await contentParser.importMarkdown(text, rootId);
          return [page.id];
        }
        return [];
      }
    );
  }

  private async _importHtml() {
    await this._importFile(
      '.html',
      async files => {
        let totalSize = 0;
        for (const file of files) {
          totalSize += file.size;
          if (totalSize > SHOW_LOADING_SIZE) return true;
        }
        return false;
      },
      async file => {
        const text = await file.text();
        const page = this.workspace.createPage({
          init: {
            title: '',
          },
        });
        const rootId = page.root?.id;
        const contentParser = new ContentParser(page);
        if (rootId) {
          await contentParser.importHtml(text, rootId);
          return [page.id];
        }
        return [];
      }
    );
  }

  private async _importNotion() {
    await this._importFile(
      '.zip',
      async files => {
        let totalSize = 0;
        for (const file of files) {
          const zip = new JSZip();
          const zipFile = await zip.loadAsync(file);
          const fileArray = Object.values(zipFile.files);
          for (const file of fileArray) {
            if (file.dir) continue;
            const fileContent = await file.async('uint8array');
            totalSize += fileContent.length;
            if (totalSize > SHOW_LOADING_SIZE) return true;
          }
        }
        return false;
      },
      async file => {
        const pageIds: string[] = [];
        const promises: Promise<void>[] = [];
        const parseZipFile = async (file: File | Blob) => {
          const zip = new JSZip();
          const zipFile = await zip.loadAsync(file);
          const pageMap = new Map<string, Page>();
          const files = Object.keys(zipFile.files);
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.startsWith('__MACOSX/')) continue;

            const lastSplitIndex = file.lastIndexOf('/');
            const fileName = file.substring(lastSplitIndex + 1);
            if (fileName.endsWith('.html') || fileName.endsWith('.md')) {
              const page = this.workspace.createPage({
                init: {
                  title: '',
                },
              });
              pageMap.set(file, page);
            }
            if (fileName.endsWith('.zip')) {
              const innerZipFile = await zipFile.file(fileName)?.async('blob');
              if (innerZipFile) {
                parseZipFile(innerZipFile);
              }
            }
          }
          const pagePromises = Array.from(pageMap.keys()).map(async file => {
            const page = pageMap.get(file);
            if (!page) return;
            const lastSplitIndex = file.lastIndexOf('/');
            const folder = file.substring(0, lastSplitIndex) || '';
            const fileName = file.substring(lastSplitIndex + 1);
            if (fileName.endsWith('.html') || fileName.endsWith('.md')) {
              const isHtml = fileName.endsWith('.html');
              const rootId = page.root?.id;
              const fetchFileHandler = async (url: string) => {
                const fileName = folder + (folder ? '/' : '') + decodeURI(url);
                return (
                  (await zipFile.file(fileName)?.async('blob')) || new Blob()
                );
              };
              const contentParser = new ContentParser(page, fetchFileHandler);
              let text = (await zipFile.file(file)?.async('string')) || '';
              pageMap.forEach((value, key) => {
                const subPageLink = key.replaceAll(' ', '%20');
                text = isHtml
                  ? text.replaceAll(
                      `href="${subPageLink}"`,
                      `href="${LINK_PRE + value.id}"`
                    )
                  : text.replaceAll(
                      `(${subPageLink})`,
                      `(${LINK_PRE + value.id})`
                    );
              });
              if (rootId) {
                if (isHtml) {
                  await contentParser.importHtml(text, rootId);
                } else {
                  await contentParser.importMarkdown(text, rootId);
                }
                pageIds.push(page.id);
              }
            }
          });
          promises.push(...pagePromises);
        };
        await parseZipFile(file);
        await Promise.all(promises);
        return pageIds;
      }
    );
  }

  private _openLearnImportLink(event: MouseEvent) {
    event.stopPropagation();
    window.open('https://community.affine.pro', '_blank');
  }

  override render() {
    if (this._loading) {
      return html`
        <header
          class="loading-header"
          @mousedown=${this._onMouseDown}
          @mouseup=${this._onMouseUp}
        >
          <div>Import</div>
          <loader-element width="50px"></loader-element>
        </header>
        <div>
          Importing the file may take some time. It depends on document size and
          complexity.
        </div>
      `;
    }
    return html`
      <header @mousedown=${this._onMouseDown} @mouseup=${this._onMouseUp}>
        <icon-button height="16px" @click=${this._onCloseClick}>
          ${CloseIcon}
        </icon-button>
        <div>Import</div>
      </header>
      <div>
        AFFiNE will gradually support more and more file types for import.
        <a href="https://community.affine.pro" target="_blank"
          >Provide feedback.</a
        >
      </div>
      <div class="button-container">
        <icon-button
          class="button-item"
          text="Markdown"
          @click=${this._importMarkDown}
        >
          ${ExportToMarkdownIcon}
        </icon-button>
        <icon-button class="button-item" text="HTML" @click=${this._importHtml}>
          ${ExportToHTMLIcon}
        </icon-button>
      </div>
      <div class="button-container">
        <icon-button
          class="button-item"
          text="Notion"
          @click=${this._importNotion}
        >
          ${NotionIcon}
          <div
            slot="optional"
            class="has-tool-tip"
            @click=${this._openLearnImportLink}
          >
            ${HelpIcon}
            <tool-tip inert arrow tip-position="top" role="tooltip">
              Learn how to Import your Notion pages into AFFiNE.
            </tool-tip>
          </div>
        </icon-button>
        <icon-button class="button-item" text="Coming soon..." disabled="true">
          ${NewIcon}
        </icon-button>
      </div>
      <!-- <div class="footer">
        <div>Migrate from other versions of AFFiNE?</div>
      </div> -->
    `;
  }
}
