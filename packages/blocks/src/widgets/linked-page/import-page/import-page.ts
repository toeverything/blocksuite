import '../loader.js';

import { assertExists } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { type Workspace } from '@blocksuite/store';
import JSZip from 'jszip';
import { html, LitElement, type PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import { ContentParser } from '../../../__internal__/content-parser/index.js';
import { REFERENCE_NODE } from '../../../__internal__/rich-text/consts.js';
import type { SerializedBlock } from '../../../__internal__/utils/index.js';
import {
  createPage,
  openFileOrFiles,
} from '../../../__internal__/utils/index.js';
import { columnManager } from '../../../database-block/common/columns/manager.js';
import { richTextPureColumnConfig } from '../../../database-block/common/columns/rich-text/define.js';
import {
  CloseIcon,
  ExportToHTMLIcon,
  ExportToMarkdownIcon,
  HelpIcon,
  NewIcon,
  NotionIcon,
} from '../../../icons/index.js';
import type { Cell, Column } from '../../../index.js';
import { styles } from './styles.js';

export type OnSuccessHandler = (
  pageIds: string[],
  isWorkspaceFile: boolean
) => void;

const SHOW_LOADING_SIZE = 1024 * 200;

export async function importMarkDown(workspace: Workspace, text: string) {
  const page = await createPage(workspace);
  const rootId = page.root?.id;
  assertExists(
    rootId,
    `Failed to import markdown, page root not found! pageId: ${page.id}`
  );
  const contentParser = new ContentParser(page);
  await contentParser.importMarkdown(text, rootId);
  return [page.id];
}

export async function importHtml(workspace: Workspace, text: string) {
  const page = await createPage(workspace);
  const rootId = page.root?.id;
  assertExists(
    rootId,
    `Failed to import HTML, page root not found! pageId: ${page.id}`
  );
  const contentParser = new ContentParser(page);
  await contentParser.importHtml(text, rootId);
  return [page.id];
}

function joinWebPaths(...paths: string[]): string {
  const fullPath = paths.join('/').replace(/\/+/g, '/');
  const parts = fullPath.split('/').filter(Boolean);

  const resolvedParts: string[] = [];

  parts.forEach(part => {
    if (part === '.') {
      return;
    }

    if (part === '..') {
      resolvedParts.pop();
    } else {
      resolvedParts.push(part);
    }
  });

  return resolvedParts.join('/');
}

export async function importNotion(workspace: Workspace, file: File) {
  const pageIds: string[] = [];
  // const allPageMap: Map<string, Page>[] = [];
  // const dataBaseSubPages = new Set<string>();
  let isWorkspaceFile = false;
  const parseZipFile = async (file: File | Blob) => {
    const zip = new JSZip();
    const zipFile = await zip.loadAsync(file);
    const pageMap = new Map<string, string>();
    // allPageMap.push(pageMap);
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
            continue;
          }
        }
        pageMap.set(file, workspace.idGenerator());
      }
      if (i === 0 && fileName.endsWith('.csv')) {
        pageMap.set(file, workspace.idGenerator());
      }
      if (fileName.endsWith('.zip')) {
        const innerZipFile = await zipFile.file(fileName)?.async('blob');
        if (innerZipFile) {
          promises.push(...(await parseZipFile(innerZipFile)));
        }
      }
    }
    const pagePromises = Array.from(pageMap.keys()).map(async file => {
      const page = await createPage(workspace, { id: pageMap.get(file) });
      if (!page) return;
      const lastSplitIndex = file.lastIndexOf('/');
      const folder = file.substring(0, lastSplitIndex) || '';
      const fileName = file.substring(lastSplitIndex + 1);
      if (
        fileName.endsWith('.html') ||
        fileName.endsWith('.md') ||
        fileName.endsWith('.csv')
      ) {
        const isHtml = fileName.endsWith('.html');
        const rootId = page.root?.id;
        const fetchFileHandler = async (url: string) => {
          const fileName = joinWebPaths(folder, decodeURI(url));
          return (await zipFile.file(fileName)?.async('blob')) || new Blob();
        };
        const textStyleHandler = (
          _element: HTMLElement,
          textStyle: Record<string, unknown>
        ) => {
          if (textStyle['link']) {
            const link = textStyle['link'] as string;
            const subPageLink = joinWebPaths(folder, decodeURI(link));
            const linkPageId = pageMap.get(subPageLink);
            if (linkPageId) {
              textStyle['reference'] = {
                pageId: linkPageId,
                type: 'LinkedPage',
              };
              delete textStyle['link'];
            }
          }
        };

        const checkFileIsSubPage = async (
          fileName: string,
          columns: Column[],
          row: string[],
          titleIndex: number
        ) => {
          const fileString =
            (await zipFile.file(fileName)?.async('string')) || '';
          // no need to parse the whole text
          const startText = fileString.substring(
            0,
            columns.join(': ').length + row.join('').length + 100
          );
          for (let i = 0; i < row.length; i++) {
            if (i === titleIndex) {
              if (!startText.includes(row[i])) {
                return false;
              }
            } else {
              // Replace non-visible characters with an empty string
              const columnName = columns[i].name.replace(/[^\x20-\x7E]/g, '');
              if (
                row[i] !== '' &&
                !startText.includes(columnName + ': ' + row[i])
              ) {
                return false;
              }
              if (row[i] === '' && startText.includes(columnName + ': ')) {
                return false;
              }
            }
          }
          return true;
        };

        const getSubPageIds = async (
          columns: Column[],
          row: string[],
          titleIndex: number
        ) => {
          const result: string[] = [];
          if (!row[titleIndex]) {
            return result;
          }

          const curFiles = files.filter(
            file =>
              file.includes(row[titleIndex] + ' ') &&
              (file.endsWith('.html') || file.endsWith('.md'))
          );
          for (let k = 0; k < curFiles.length; k++) {
            const curFile = curFiles[k];
            const isSubPage = await checkFileIsSubPage(
              curFile,
              columns,
              row,
              titleIndex
            );
            if (isSubPage && pageMap.has(curFile)) {
              result.push(pageMap.get(curFile) ?? '');
            }
          }
          return result;
        };

        const csvParseHandler = async (fileName: string, titleText: string) => {
          const tableString =
            (await zipFile.file(fileName)?.async('string')) ?? '';
          let result: SerializedBlock[] | null = [];
          let id = 1;
          const titles: string[] = [];
          const rows: string[][] = [];
          tableString?.split(/\r\n|\r|\n/).forEach((row, index) => {
            const rowArray = row.split(/,\s*(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            for (let i = 0; i < rowArray.length; i++) {
              rowArray[i] = rowArray[i].replace(/^"|"$/g, '');
            }
            if (index === 0) {
              titles.push(...rowArray);
            } else {
              rows.push(rowArray);
            }
          });

          const columns: Column[] = titles.map(value => {
            return columnManager
              .getColumn(richTextPureColumnConfig.type)
              .createWithId('' + id++, value);
          });
          if (rows.length > 0) {
            let maxLen = rows[0].length;
            for (let i = 1; i < rows.length; i++) {
              maxLen = Math.max(maxLen, rows[i].length);
            }
            const addNum = maxLen - columns.length;
            for (let i = 0; i < addNum; i++) {
              columns.push(
                columnManager
                  .getColumn(richTextPureColumnConfig.type)
                  .createWithId('' + id++, '')
              );
            }
          }

          if (columns.length === 0 || rows.length === 0) {
            return [];
          }

          let titleIndex = 0;
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            let rowHasSubPageCount = 0;
            let rowTitleIndex = 0;
            let subPageIds = [];
            for (let j = 0; j < row.length; j++) {
              subPageIds = await getSubPageIds(columns, row, j);
              if (subPageIds.length > 0) {
                rowTitleIndex = j;
                rowHasSubPageCount++;
                if (rowHasSubPageCount > 1) {
                  break;
                }
              }
            }
            if (rowHasSubPageCount === 1) {
              titleIndex = rowTitleIndex;
              if (subPageIds.length === 1) {
                break;
              }
            }
          }
          titleIndex = titleIndex < columns.length ? titleIndex : 0;
          columns[titleIndex].type = 'title';
          for (let i = 0; i < rows.length; i++) {
            if (titleIndex >= rows[i].length) {
              continue;
            }
            const linkPageIds = await getSubPageIds(
              columns,
              rows[i],
              titleIndex
            );
            if (linkPageIds.length > 0) {
              rows[i][titleIndex] = `@AffineReference:(${linkPageIds[0]})`;
            }
          }

          const databasePropsId = id++;
          const cells: Record<string, Record<string, Cell>> = {};
          const children: SerializedBlock[] = [];
          rows.forEach(row => {
            const title = row[titleIndex];
            const referencePattern = /@AffineReference:\((.*)\)/g;
            const match = referencePattern.exec(title);
            if (match) {
              const pageId = match[1];
              children.push({
                flavour: 'affine:paragraph',
                type: 'text',
                text: [
                  {
                    insert: REFERENCE_NODE,
                    attributes: {
                      reference: { type: 'Subpage', pageId },
                    },
                  },
                ],
                children: [],
              });
            } else {
              children.push({
                flavour: 'affine:paragraph',
                type: 'text',
                text: [{ insert: title }],
                children: [],
              });
            }
            const rowId = '' + id++;
            cells[rowId] = {};
            row.forEach((value, index) => {
              cells[rowId][columns[index].id] = {
                columnId: columns[index].id,
                value,
              };
            });
          });
          result = [
            {
              flavour: 'affine:database',
              databaseProps: {
                id: '' + databasePropsId,
                title: titleText || 'Database',
                rowIds: Object.keys(cells),
                cells: cells,
                columns: columns,
                views: [
                  {
                    id: page.generateId(),
                    name: 'Table View',
                    mode: 'table',
                    columns: [],
                    header: {
                      titleColumn: columns[titleIndex].id,
                      iconColumn: 'type',
                    },
                    filter: {
                      type: 'group',
                      op: 'and',
                      conditions: [],
                    },
                  },
                ],
              },
              children: children,
            },
          ];
          return result;
        };

        const tableParseHandler = async (element: Element) => {
          // if (element.tagName === 'TABLE') {
          //   const parentElement = element.parentElement;
          //   if (
          //     parentElement?.tagName === 'DIV' &&
          //     parentElement.hasAttribute('id')
          //   ) {
          //     parentElement.id && dataBaseSubPages.add(parentElement.id);
          //   }
          //   const tbodyElement = element.querySelector('tbody');
          //   tbodyElement?.querySelectorAll('tr').forEach(ele => {
          //     ele.id && dataBaseSubPages.add(ele.id);
          //   });
          // }
          if (
            element.tagName === 'A' &&
            element.getAttribute('href')?.endsWith('.csv')
          ) {
            const href = element.getAttribute('href') || '';
            const fileName = joinWebPaths(folder, decodeURI(href));
            const result = await csvParseHandler(
              fileName,
              element.textContent || ''
            );
            return result;
          }
          return null;
        };
        const tableTitleColumnHandler = async (element: Element) => {
          if (element.tagName === 'TABLE') {
            const titleColumn: SerializedBlock[] = [];
            element.querySelectorAll('.cell-title').forEach(ele => {
              const link = ele.querySelector('a');
              const subPageLink = link?.getAttribute('href') || '';
              if (
                subPageLink.startsWith('http://') ||
                subPageLink.startsWith('https://')
              ) {
                titleColumn.push({
                  flavour: 'affine:paragraph',
                  type: 'text',
                  text: [{ insert: ele?.textContent || '' }],
                  children: [],
                });
                return;
              }
              const linkPageId = pageMap.get(decodeURI(subPageLink));
              if (linkPageId) {
                titleColumn.push({
                  flavour: 'affine:paragraph',
                  type: 'text',
                  text: [
                    {
                      insert: REFERENCE_NODE,
                      attributes: {
                        reference: { type: 'Subpage', pageId: linkPageId },
                      },
                    },
                  ],
                  children: [],
                });
              } else {
                titleColumn.push({
                  flavour: 'affine:paragraph',
                  type: 'text',
                  text: [{ insert: link?.textContent || '' }],
                  children: [],
                });
              }
            });
            return titleColumn;
          }
          return null;
        };
        const contentParser = new ContentParser(page, {
          fetchFileHandler,
          textStyleHandler,
          tableParseHandler,
          tableTitleColumnHandler,
        });
        if (rootId) {
          pageIds.push(page.id);
          if (fileName.endsWith('.csv')) {
            const lastSpace = fileName.lastIndexOf(' ');
            const csvName =
              lastSpace === -1 ? '' : fileName.substring(0, lastSpace);
            const csvRealName = csvName === 'Undefined' ? '' : csvName;
            const blocks = await csvParseHandler(file, csvRealName);
            if (blocks) {
              await contentParser.importBlocks(blocks, rootId);
            }
          } else if (isHtml) {
            const text = (await zipFile.file(file)?.async('string')) ?? '';
            await contentParser.importHtml(text, rootId);
          } else {
            const text = (await zipFile.file(file)?.async('string')) ?? '';
            await contentParser.importMarkdown(text, rootId);
          }
        }
      }
    });
    promises.push(...pagePromises);
    return promises;
  };
  const allPromises = await parseZipFile(file);
  await Promise.all(allPromises.flat());
  // dataBaseSubPages.forEach(notionId => {
  //   const dbSubPageId = notionId.replace(/-/g, '');
  //   allPageMap.forEach(pageMap => {
  //     for (const [key, value] of pageMap) {
  //       if (
  //         key.endsWith(` ${dbSubPageId}.html`) ||
  //         key.endsWith(` ${dbSubPageId}.md`)
  //       ) {
  //         pageIds = pageIds.filter(id => id !== value.id);
  //         this.workspace.removePage(value.id);
  //         break;
  //       }
  //     }
  //   });
  // });
  return { pageIds, isWorkspaceFile };
}

/**
 * @deprecated Waiting for migration
 * See https://github.com/toeverything/blocksuite/issues/3316
 */
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
        <div class="overlay-mask"></div>
        <div class="container">
          <header
            class="loading-header"
            @mousedown="${this._onMouseDown}"
            @mouseup="${this._onMouseUp}"
          >
            <div>Import</div>
            <loader-element width="50px"></loader-element>
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
              class="has-tool-tip"
              @click="${this._openLearnImportLink}"
            >
              ${HelpIcon}
              <tool-tip inert arrow tip-position="top" role="tooltip">
                Learn how to Import your Notion pages into AFFiNE.
              </tool-tip>
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
