import type { EditorHost } from '@blocksuite/block-std';
import type { BlockComponent } from '@blocksuite/block-std';

import { html } from 'lit';

import { htmlToElement } from './html-to-element.js';

export const createToastContainer = (editorHost: EditorHost) => {
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
  const { std, doc } = editorHost;
  if (!doc.root) {
    return null;
  }
  const rootComponent = std.view.getBlock(doc.root.id) as BlockComponent & {
    viewportElement: HTMLElement;
  };
  if (!rootComponent) {
    return null;
  }
  const viewportElement = rootComponent.viewportElement;
  viewportElement?.append(element);
  return element;
};
