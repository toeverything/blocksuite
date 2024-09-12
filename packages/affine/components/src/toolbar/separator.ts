import { css, LitElement } from 'lit';

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

declare global {
  interface HTMLElementTagNameMap {
    'editor-toolbar-separator': EditorToolbarSeparator;
  }
}
