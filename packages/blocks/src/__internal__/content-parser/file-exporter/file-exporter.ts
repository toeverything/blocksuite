/* eslint-disable no-control-regex */
import type { BlobManager } from '@blocksuite/store';

import { EDITOR_WIDTH } from '../../consts.js';
import { globalCSS } from './exporter-style.js';

// Context: Lean towards breaking out any localizable content into constants so it's
// easier to track content we may need to localize in the future. (i18n)
const UNTITLED_PAGE_NAME = 'Untitled';

/** Tools for exporting files to device. For example, via browser download. */
export const FileExporter = {
  /**
   * Create a download for the user's browser.
   *
   * @param filename
   * @param text
   * @param mimeType like `"text/plain"`, `"text/html"`, `"application/javascript"`, etc. See {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types mdn docs List of MIME types}.
   *
   * @remarks
   * Only accepts data in utf-8 encoding (html files, javascript source, text files, etc).
   *
   * @example
   * const todoMDText = `# Todo items
   * [ ] Item 1
   * [ ] Item 2
   * `
   * FileExporter.exportFile("Todo list.md", todoMDText, "text/plain")
   *
   * @example
   * const stateJsonContent = JSON.stringify({ a: 1, b: 2, c: 3 })
   * FileExporter.exportFile("state.json", jsonContent, "application/json")
   */
  exportFile(filename: string, dataURL: string) {
    const element = document.createElement('a');
    element.setAttribute('href', dataURL);
    const safeFilename = getSafeFileName(filename);
    element.setAttribute('download', safeFilename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  },
  exportTextFile(filename: string, text: string, mimeType: string) {
    FileExporter.exportFile(
      filename,
      'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(text)
    );
  },
  async exportHtml(
    title: string | undefined,
    pageId: string,
    htmlContent: string,
    blobMap: Map<string, string>,
    blobs: BlobManager
  ) {
    const JSZip = (await import('jszip')).default;

    const pageTitle = title?.trim() ?? UNTITLED_PAGE_NAME;
    const zipFile = new JSZip();
    for (const [key, value] of blobMap) {
      const blob = await blobs.get(key);
      blob && zipFile.file(value, blob);
    }
    zipFile.file(
      `${pageTitle}|${pageId}.html`,
      wrapHtmlWithHtmlDocumentText(pageTitle, htmlContent)
    );

    const blob = await zipFile.generateAsync({ type: 'blob' });
    const fileURL = URL.createObjectURL(blob);
    FileExporter.exportFile(`${pageTitle}|HTML.zip`, fileURL);
    URL.revokeObjectURL(fileURL);
  },
  async exportHtmlAsMarkdown(
    title: string | undefined,
    pageId: string,
    htmlContent: string,
    blobMap: Map<string, string>,
    blobs: BlobManager
  ) {
    const JSZip = (await import('jszip')).default;
    const TurndownService = (await import('turndown')).default;
    const turndownService = new TurndownService();
    turndownService.addRule('input', {
      //@ts-ignore
      [Symbol.iterator](): IterableIterator<string> {
        //@ts-ignore
        return undefined;
      },
      anchor(_name: string): string {
        return '';
      },
      big(): string {
        return '';
      },
      blink(): string {
        return '';
      },
      bold(): string {
        return '';
      },
      charAt(_pos: number): string {
        return '';
      },
      charCodeAt(_index: number): number {
        return 0;
      },
      codePointAt(_pos: number): number | undefined {
        return undefined;
      },
      concat(_strings: string): string {
        return '';
      },
      endsWith(
        _searchString: string,
        _endPosition: number | undefined
      ): boolean {
        return false;
      },
      fixed(): string {
        return '';
      },
      fontcolor(_color: string): string {
        return '';
      },
      includes(_searchString: string, _position: number | undefined): boolean {
        return false;
      },
      indexOf(_searchString: string, _position: number | undefined): number {
        return 0;
      },
      italics(): string {
        return '';
      },
      lastIndexOf(
        _searchString: string,
        _position: number | undefined
      ): number {
        return 0;
      },
      length: 0,
      link(_url: string): string {
        return '';
      },
      repeat(_count: number): string {
        return '';
      },
      slice(_start: number | undefined, _end: number | undefined): string {
        return '';
      },
      small(): string {
        return '';
      },
      startsWith(
        _searchString: string,
        _position: number | undefined
      ): boolean {
        return false;
      },
      strike(): string {
        return '';
      },
      sub(): string {
        return '';
      },
      substr(_from: number, _length: number | undefined): string {
        return '';
      },
      substring(_start: number, _end: number | undefined): string {
        return '';
      },
      sup(): string {
        return '';
      },
      toLocaleLowerCase(_locales: string | string[] | undefined): string {
        return '';
      },
      toLocaleUpperCase(_locales: string | string[] | undefined): string {
        return '';
      },
      toLowerCase(): string {
        return '';
      },
      toString(): string {
        return '';
      },
      toUpperCase(): string {
        return '';
      },
      trim(): string {
        return '';
      },
      valueOf(): string {
        return '';
      },
      fontsize(_size: string | number): string {
        return '';
      },
      localeCompare(
        _that: string,
        _locales?: string | string[],
        _options?: Intl.CollatorOptions
      ): number {
        return 0;
      },
      match(
        _matcher:
          | { [Symbol.match](string: string): RegExpMatchArray | null }
          | string
          | RegExp
      ): RegExpMatchArray | null {
        //@ts-ignore
        return undefined;
      },
      normalize(_form?: 'NFC' | 'NFD' | 'NFKC' | 'NFKD' | string): string {
        return '';
      },
      replace(
        _searchValue:
          | {
              [Symbol.replace](
                string: string,
                replacer: (substring: string, ...args: unknown[]) => string
              ): string;
            }
          | string
          | RegExp
          | { [Symbol.replace](string: string, replaceValue: string): string },
        _replacer: ((substring: string, ...args: unknown[]) => string) | string
      ): string {
        return '';
      },
      search(
        _regexp: string | RegExp | { [Symbol.search](string: string): number }
      ): number {
        return 0;
      },
      split(
        _separator:
          | string
          | RegExp
          | { [Symbol.split](string: string, limit?: number): string[] },
        _limit?: number
      ): string[] {
        return [];
      },
      filter: ['input'],
      replacement: function (_content: string, node) {
        return (node as HTMLElement).getAttribute('checked') === null
          ? '[ ] '
          : '[x] ';
      },
    });
    turndownService.addRule('codeBlock', {
      filter: ['pre'],
      replacement: function (_content: string, node: Node) {
        const element = node as Element;
        return (
          '```' +
          element.getAttribute('code-lang') +
          '\n' +
          node.textContent +
          '```\n'
        );
      },
    });
    turndownService.keep(['del', 'u']);
    turndownService.addRule('bookMark', {
      filter: function (node: HTMLElement) {
        return (
          node.nodeName === 'DIV' &&
          node.classList.contains('affine-bookmark-block-container')
        );
      },
      replacement: function (_content: string, node: Node) {
        const element = node as Element;
        const titleElement = element.querySelector(
          '.affine-bookmark-title-content'
        );
        const urlElement = element.querySelector('.affine-bookmark-url');
        return `[${titleElement?.textContent}](${urlElement?.textContent})\n`;
      },
    });
    turndownService.addRule('pageMetaData', {
      filter: function (node: HTMLElement) {
        return (
          node.nodeName === 'DIV' && node.classList.contains('page-meta-data')
        );
      },
      replacement: function (_content: string, node: Node) {
        const element = node as Element;
        const tagEles = element.querySelectorAll('.tag');
        return tagEles.length > 0
          ? `Tags: ${Array.from(tagEles)
              .map(ele => ele.textContent)
              .join(', ')}`
          : '';
      },
    });

    const markdown = turndownService.turndown(htmlContent);

    const pageTitle = title?.trim() ?? UNTITLED_PAGE_NAME;
    const zipFile = new JSZip();
    for (const [key, value] of blobMap) {
      const blob = await blobs.get(key);
      blob && zipFile.file(value, blob);
    }
    zipFile.file(`${pageTitle}|${pageId}.md`, markdown);

    const blob = await zipFile.generateAsync({ type: 'blob' });
    const fileURL = URL.createObjectURL(blob);
    FileExporter.exportFile(`${pageTitle}|MarkDown.zip`, fileURL);
    URL.revokeObjectURL(fileURL);
  },
  exportPng(pageTitle: string | undefined, dataURL: string) {
    const title = pageTitle?.trim() || UNTITLED_PAGE_NAME;
    FileExporter.exportFile(title + '.png', dataURL);
  },
};

/** @internal surround plain html content in a document with head and basic styles */
function wrapHtmlWithHtmlDocumentText(pageTitle: string, htmlContent: string) {
  // Question: Why not embed css directly into html?
  const htmlCss = `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css">
<style>
  ${globalCSS}
</style>`;
  // Question: Do we really need the extra div container?
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${pageTitle}</title>
  ${htmlCss}
</head>
<body>
<div style="margin:0 auto;padding:1rem;max-width:${EDITOR_WIDTH}px">
${htmlContent}
</div>
</body>
</html>
`;
}

function getSafeFileName(string: string) {
  const replacement = ' ';
  const filenameReservedRegex = /[<>:"/\\|?*\u0000-\u001F]/g;
  const windowsReservedNameRegex = /^(con|prn|aux|nul|com\d|lpt\d)$/i;
  const reControlChars = /[\u0000-\u001F\u0080-\u009F]/g;
  const reTrailingPeriods = /\.+$/;
  const allowedLength = 50;

  function trimRepeated(string: string, target: string) {
    const escapeStringRegexp = target
      .replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
      .replace(/-/g, '\\x2d');
    const regex = new RegExp(`(?:${escapeStringRegexp}){2,}`, 'g');
    return string.replace(regex, target);
  }

  string = string
    .normalize('NFD')
    .replace(filenameReservedRegex, replacement)
    .replace(reControlChars, replacement)
    .replace(reTrailingPeriods, '');

  string = trimRepeated(string, replacement);
  string = windowsReservedNameRegex.test(string)
    ? string + replacement
    : string;
  const extIndex = string.lastIndexOf('.');
  const filename = string.slice(0, extIndex).trim();
  const extension = string.slice(extIndex);
  string =
    filename.slice(0, Math.max(1, allowedLength - extension.length)) +
    extension;
  return string;
}
