import { html, LitElement, type PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import type { PageMeta, Workspace } from '../workspace.js';

@customElement('test-app')
export class TestApp extends LitElement {
  workspace!: Workspace;

  @property()
  pages: Pick<PageMeta, 'title' | 'favorite'>[] = [];

  @query('input[name="page"]')
  input!: HTMLInputElement;

  private _toggleFavorite(index: number) {
    const { id } = this.workspace.meta.pageMetas[index];
    this.workspace.setPageMeta(id, { favorite: !this.pages[index].favorite });
  }

  private _createPage() {
    const id = `${this.pages.length}`;
    this.workspace.createPage(id);
    this.workspace.setPageMeta(id, { title: this.input.value });
    this.input.value = '';
  }

  override firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);

    this.workspace.slots.pagesUpdated.on(() => {
      this.pages = this.workspace.meta.pageMetas.map(page => ({
        title: page.title,
        favorite: page.favorite,
      }));
      this.requestUpdate();
    });

    this.workspace.slots;
  }

  override render() {
    return html`
      <div>
        <input type="text" name="page" placeholder="add a page" />
        <button type="button" @click=${this._createPage}>add</button>
      </div>
      <ul>
        ${this.pages.map(
          (todo, index) => html`
            <li>
              <input
                type="checkbox"
                .checked=${todo.favorite}
                @change=${() => this._toggleFavorite(index)}
              />
              ${todo.title}
            </li>
          `
        )}
      </ul>
    `;
  }
}
