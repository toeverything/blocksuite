import TurndownService from 'turndown';
import { globalCSS, highlightCSS } from './exporter-style.js';
import filenamify from 'filenamify';

// Context: Lean towards breaking out any localizable content into constants so it's
// easier to track content we may need to localize in the future. (i18n)
const UNTITLED_PAGE_NAME = 'Untitled';

/** Tools for exporting files to device. For example, via browser download. */
export const FileExporter = {
  /**
   * Create a download for the user's browser.
   *
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
    console.log(safeFilename);
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
      filter: ['input'],
      replacement: function (content, node) {
        return (node as HTMLElement).getAttribute('checked') === null
          ? '[ ] '
          : '[x] ';
      },
    });
    turndownService.addRule('codeBlock', {
      filter: ['pre'],
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
  ${highlightCSS}
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
<div style="margin:0 auto;padding:1rem;max-width:720px">
${htmlContent}
</div>
</body>
</html>
`;
}

function getSafeFileName(filename: string) {
  const dot = filename.lastIndexOf('.');
  const name = filename.slice(0, dot);
  const ext = filename.slice(dot);
  return filenamify(name, { replacement: ' ' }).trim() + ext;
}
