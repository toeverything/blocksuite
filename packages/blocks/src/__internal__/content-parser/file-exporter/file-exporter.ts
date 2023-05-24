/* eslint-disable no-control-regex */
import { EDITOR_WIDTH } from '@blocksuite/global/config';
import TurndownService from 'turndown';

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
  exportTextFile(filename: string, text: string, mimeType: string) {
    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(text)
    );
    const safeFilename = getSafeFileName(filename);
    element.setAttribute('download', safeFilename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  },
  exportHtml(pageTitle: string | undefined, htmlContent: string) {
    const title = pageTitle?.trim() || UNTITLED_PAGE_NAME;
    FileExporter.exportTextFile(
      title + '.html',
      wrapHtmlWithHtmlDocumentText(title, htmlContent),
      'text/html'
    );
  },
  exportHtmlAsMarkdown(pageTitle: string | undefined, htmlContent: string) {
    const turndownService = new TurndownService();
    turndownService.addRule('input', {
      //@ts-ignore
      [Symbol.iterator](): IterableIterator<string> {
        //@ts-ignore
        return undefined;
      },
      anchor(name: string): string {
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
      charAt(pos: number): string {
        return '';
      },
      charCodeAt(index: number): number {
        return 0;
      },
      codePointAt(pos: number): number | undefined {
        return undefined;
      },
      concat(strings: string): string {
        return '';
      },
      endsWith(searchString: string, endPosition: number | undefined): boolean {
        return false;
      },
      fixed(): string {
        return '';
      },
      fontcolor(color: string): string {
        return '';
      },
      includes(searchString: string, position: number | undefined): boolean {
        return false;
      },
      indexOf(searchString: string, position: number | undefined): number {
        return 0;
      },
      italics(): string {
        return '';
      },
      lastIndexOf(searchString: string, position: number | undefined): number {
        return 0;
      },
      length: 0,
      link(url: string): string {
        return '';
      },
      repeat(count: number): string {
        return '';
      },
      slice(start: number | undefined, end: number | undefined): string {
        return '';
      },
      small(): string {
        return '';
      },
      startsWith(searchString: string, position: number | undefined): boolean {
        return false;
      },
      strike(): string {
        return '';
      },
      sub(): string {
        return '';
      },
      substr(from: number, length: number | undefined): string {
        return '';
      },
      substring(start: number, end: number | undefined): string {
        return '';
      },
      sup(): string {
        return '';
      },
      toLocaleLowerCase(locales: string | string[] | undefined): string {
        return '';
      },
      toLocaleUpperCase(locales: string | string[] | undefined): string {
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
      fontsize(size: string | number): string {
        return '';
      },
      localeCompare(
        that: string,
        locales?: string | string[],
        options?: Intl.CollatorOptions
      ): number {
        return 0;
      },
      match(
        matcher:
          | { [Symbol.match](string: string): RegExpMatchArray | null }
          | string
          | RegExp
      ): RegExpMatchArray | null {
        //@ts-ignore
        return undefined;
      },
      normalize(form?: 'NFC' | 'NFD' | 'NFKC' | 'NFKD' | string): string {
        return '';
      },
      replace(
        searchValue:
          | {
              [Symbol.replace](
                string: string,
                replacer: (substring: string, ...args: unknown[]) => string
              ): string;
            }
          | string
          | RegExp
          | { [Symbol.replace](string: string, replaceValue: string): string },
        replacer: ((substring: string, ...args: unknown[]) => string) | string
      ): string {
        return '';
      },
      search(
        regexp: string | RegExp | { [Symbol.search](string: string): number }
      ): number {
        return 0;
      },
      split(
        separator:
          | string
          | RegExp
          | { [Symbol.split](string: string, limit?: number): string[] },
        limit?: number
      ): string[] {
        return [];
      },
      filter: ['input'],
      //@ts-ignore
      replacement: function (content, node) {
        return (node as HTMLElement).getAttribute('checked') === null
          ? '[ ] '
          : '[x] ';
      },
    });
    turndownService.addRule('codeBlock', {
      filter: ['pre'],
      //@ts-ignore
      replacement: function (content, node: Node) {
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
    const markdown = turndownService.turndown(htmlContent);
    const title = pageTitle?.trim() || UNTITLED_PAGE_NAME;
    FileExporter.exportTextFile(title + '.md', markdown, 'text/plain');
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
