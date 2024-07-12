import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('editor-toolbar-separator')
export class EditorToolbarSeparator extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      align-self: stretch;
      flex-shrink: 0;

      width: 4px;
    }

    :host::after {
      content: '';
      display: flex;
      width: 0.5px;
      height: 100%;
      background-color: var(--affine-border-color);
    }

    :host([data-orientation='horizontal']) {
      height: 8px;
      width: unset;
    }

    :host([data-orientation='horizontal'])::after {
      height: 0.5px;
      width: 100%;
    }
  `;
}

export function renderToolbarSeparator() {
  return html`<editor-toolbar-separator></editor-toolbar-separator>`;
}

declare global {
  interface HTMLElementTagNameMap {
    'editor-toolbar-separator': EditorToolbarSeparator;
  }
}
