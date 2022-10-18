import TurndownService from 'turndown';

const FileExporter = {
  injectHtmlCss: () => {
    //TODO why not use css file?
    return `
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css">
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
    </style>
    `;
  },
  exportFile: (filename: string, text: string, format: string) => {
    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:' + format + ';charset=utf-8,' + encodeURIComponent(text)
    );
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  },
  decorateHtml: (pageTitle: string, htmlContent: string) => {
    const htmlCss = FileExporter.injectHtmlCss();
    return `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${pageTitle}</title>
          ${htmlCss}
        </head>
        <body>
            <div style="margin:0 auto;width:720px" >
                 ${htmlContent}
            </div>
        </body>
        </html>`;
  },
  exportHtml: (pageTitle: string, htmlContent: string) => {
    FileExporter.exportFile(
      (pageTitle || 'Untitled') + '.html',
      FileExporter.decorateHtml(pageTitle, htmlContent),
      'text/html'
    );
  },

  exportMarkdown: (pageTitle: string, htmlContent: string) => {
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
    FileExporter.exportFile(
      (pageTitle || 'Undefined') + '.md',
      markdown,
      'text/plain'
    );
  },
};

export { FileExporter };
