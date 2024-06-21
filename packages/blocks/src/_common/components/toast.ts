import type { EditorHost } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { baseTheme } from '@toeverything/theme';
import { html, type TemplateResult } from 'lit';

import { getRootByEditorHost } from '../utils/query.js';

let ToastContainer: HTMLDivElement | null = null;

/**
 * DO NOT USE FOR USER INPUT
 * See https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
 */
const htmlToElement = <T extends ChildNode>(html: string | TemplateResult) => {
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

const createToastContainer = (editorHost: EditorHost) => {
  const styles = `
    position: fixed;
    z-index: 9999;
    top: 16px;
    left: 16px;
    right: 16px;
    bottom: 78px;
    pointer-events: none;
    display: flex;
    flex-direction: column-reverse;
    align-items: center;
  `;
  const template = html`<div class="toast-container" style="${styles}"></div>`;
  const element = htmlToElement<HTMLDivElement>(template);
  const rootElement = getRootByEditorHost(editorHost);
  assertExists(rootElement);
  const viewportElement = rootElement.viewportElement;
  viewportElement?.append(element);
  return element;
};

/**
 * @example
 * ```ts
 * toast('Hello World');
 * ```
 */
export const toast = (
  editorHost: EditorHost,
  message: string,
  duration = 2500
) => {
  if (!ToastContainer) {
    ToastContainer = createToastContainer(editorHost);
  }

  const styles = `
    max-width: 480px;
    text-align: center;
    font-family: ${baseTheme.fontSansFamily};
    font-size: var(--affine-font-sm);
    padding: 6px 12px;
    margin: 10px 0 0 0;
    color: var(--affine-white);
    background: var(--affine-tooltip);
    box-shadow: var(--affine-float-button-shadow);
    border-radius: 10px;
    transition: all 230ms cubic-bezier(0.21, 1.02, 0.73, 1);
    opacity: 0;
  `;

  const template = html`<div style="${styles}"></div>`;
  const element = htmlToElement<HTMLDivElement>(template);
  // message is not trusted
  element.textContent = message;
  ToastContainer.append(element);

  const fadeIn = [
    {
      opacity: 0,
    },
    { opacity: 1 },
  ];
  const options = {
    duration: 230,
    easing: 'cubic-bezier(0.21, 1.02, 0.73, 1)',
    fill: 'forwards' as const,
  }; // satisfies KeyframeAnimationOptions;
  element.animate(fadeIn, options);

  setTimeout(() => {
    const fadeOut = fadeIn.reverse();
    const animation = element.animate(fadeOut, options);
    animation.finished
      .then(() => {
        element.style.maxHeight = '0';
        element.style.margin = '0';
        element.style.padding = '0';
        element.addEventListener(
          'transitionend',
          () => {
            element.remove();
          },
          {
            once: true,
          }
        );
      })
      .catch(console.error);
  }, duration);
  return element;
};
