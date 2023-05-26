import '../loader.js';

import {
  CloseIcon,
  ExportToHTMLIcon,
  ExportToMarkdownIcon,
  NewIcon,
  NotionIcon,
  OpenInNewIcon,
} from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import type { Page, Workspace } from '@blocksuite/store';
import JSZip from 'jszip';
import { html, LitElement, type PropertyValues } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { ContentParser } from '../../__internal__/content-parser/index.js';
import { styles } from './styles.js';
const LINK_PRE = 'Affine-LinkedPage-';
export type OnSuccessFunc = (pageIds: string[]) => void;
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
    private onSuccess?: OnSuccessFunc,
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

  private async _selectFile(accept: string): Promise<File> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = false;
    input.click();
    return new Promise((resolve, reject) => {
      input.onchange = () => {
        const file = input.files?.item(0);
        if (!file) {
          reject();
        }
        resolve(file as File);
      };
      input.onerror = () => {
        reject();
      };
    });
  }

  private async _importFile(
    fileExtension: string,
    needLoadingFunc: (file: File) => Promise<boolean>,
    parseContentFunc: (file: File) => Promise<void>
  ) {
    this.hidden = true;
    const file = await this._selectFile(fileExtension);
    const needLoading = await needLoadingFunc(file);
    if (needLoading) {
      this.hidden = false;
      this._loading = true;
    } else {
      this.abortController.abort();
    }
    await parseContentFunc(file);
    needLoading && this.abortController.abort();
  }

  private async _importMarkDown() {
    await this._importFile(
      '.md',
      async file => {
        return file.size > SHOW_LOADING_SIZE;
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
        rootId && (await contentParser.importMarkdown(text, rootId));
        this.onSuccess?.([page.id]);
      }
    );
  }

  private async _importHtml() {
    await this._importFile(
      '.html',
      async file => {
        return file.size > SHOW_LOADING_SIZE;
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
        rootId && (await contentParser.importHtml(text, rootId));
        this.onSuccess?.([page.id]);
      }
    );
  }

  private async _importNotion() {
    await this._importFile(
      '.zip',
      async file => {
        const zip = new JSZip();
        const zipFile = await zip.loadAsync(file);
        const fileArray = Object.values(zipFile.files);

        let totalUncompressedSize = 0;
        for (const file of fileArray) {
          if (file.dir) continue;
          if (totalUncompressedSize > SHOW_LOADING_SIZE) return true;
          const fileContent = await file.async('uint8array');
          totalUncompressedSize += fileContent.length;
        }
        return totalUncompressedSize > SHOW_LOADING_SIZE;
      },
      async file => {
        const zip = new JSZip();
        const zipFile = await zip.loadAsync(file);
        const pageMap = new Map<string, Page>();
        const files = Object.keys(zipFile.files);
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
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
        }
        pageMap.forEach(async (page, file) => {
          const lastSplitIndex = file.lastIndexOf('/');
          const folder = file.substring(0, lastSplitIndex) || '';
          const fileName = file.substring(lastSplitIndex + 1);
          if (fileName.endsWith('.html') || fileName.endsWith('.md')) {
            const isHtml = fileName.endsWith('.html');
            const rootId = page.root?.id;
            const fetchFileFunc = async (url: string) => {
              const fileName =
                folder + (folder ? '/' : '') + url.replaceAll('%20', ' ');
              return (
                (await zipFile.file(fileName)?.async('blob')) || new Blob()
              );
            };
            const contentParser = new ContentParser(page, fetchFileFunc);
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
            }
          }
        });
        this.onSuccess?.([...pageMap.values()].map(page => page.id));
      }
    );
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
        <a href="www.google.com">Provide feedback.</a>
      </div>
      <div class="button-container">
        <icon-button
          class="button-item"
          text="Markdown"
          @click=${this._importMarkDown}
        >
          ${ExportToMarkdownIcon}
        </icon-button>
        <icon-button class="button-item" text="Html" @click=${this._importHtml}>
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
        </icon-button>
        <icon-button class="button-item" text="Coming soon..." disabled="true">
          ${NewIcon}
        </icon-button>
      </div>
      <div class="footer">
        <div>Migrate from other versions of AFFiNE?</div>
        <icon-button class="button-item"> ${OpenInNewIcon} </icon-button>
      </div>
    `;
  }
}
