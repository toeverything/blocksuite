import type { TemplateResult } from 'lit';

/**
 * DO NOT USE FOR USER INPUT
 * See https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
 */
export const htmlToElement = <T extends ChildNode>(
  html: string | TemplateResult
) => {
  const template = document.createElement('template');
  if (typeof html === 'string') {
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
  } else {
    const htmlString = String.raw(html.strings, ...html.values);
    template.innerHTML = htmlString;
  }
  return template.content.firstChild as T;
};
