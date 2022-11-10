import TurndownService from 'turndown';

// Context: Lean towards breaking out any localizable content into constants so it's
// easier to track content we may need to localize in the future. (i18n)
const UNTITLED_PAGE_NAME = "Untitled"

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
    // Consider if we should replace invalid characters in filenames before downloading, or if the browser
    // will do that for us automatically...
    // // replace illegal characters that cannot appear in file names
    // const safeFilename = filename.replace(/[ <>:/|?*]+/g, " ")
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  },
  exportHtml(pageTitle: string | undefined, htmlContent: string) {
    const title = (pageTitle?.trim() || UNTITLED_PAGE_NAME)
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
    const markdown = turndownService.turndown(htmlContent);
    const title = (pageTitle?.trim() || UNTITLED_PAGE_NAME)
    FileExporter.exportTextFile(
      title + '.md',
      markdown,
      'text/plain'
    );
  },
};

/** @internal surround plain html content in a document with head and basic styles */
function wrapHtmlWithHtmlDocumentText(pageTitle: string, htmlContent: string) {
  // Question: Why not embed css directly into html?
  const htmlCss = `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css">
<style>
  :root {
    --affine-primary-color: #3a4c5c;
    --affine-font-family: Avenir Next, apple-system, BlinkMacSystemFont, Helvetica Neue, Tahoma, PingFang SC, Microsoft Yahei, Arial, Hiragino Sans GB, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;
    --affine-font-family2: Roboto Mono, apple-system, BlinkMacSystemFont, Helvetica Neue, Tahoma, PingFang SC, Microsoft Yahei, Arial, Hiragino Sans GB, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;
  }
  body {
    font-family: var(--affine-font-family);
    color: var(--affine-primary-color);
  }
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
