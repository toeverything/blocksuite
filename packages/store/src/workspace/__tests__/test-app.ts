import type { PageMeta, Workspace } from '../workspace';
import { LitElement, html, PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

@customElement('test-app')
export class TestApp extends LitElement {
  workspace!: Workspace;

  @property()
  pages: Omit<PageMeta, 'id' | 'trash'>[] = [];

  @query('input[name="page"]')
  input!: HTMLInputElement;

  private _toggleFavorite(index: number) {
    const { id } = this.workspace.meta.pages[index];
    this.workspace.setPage(id, { favorite: !this.pages[index].favorite });
  }

  private _createPage() {
    const id = `${this.pages.length}`;
    this.workspace.createPage(id, this.input.value);
    this.input.value = '';
  }

  firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);

    this.workspace.signals.pagesUpdated.on(() => {
      this.pages = this.workspace.meta.pages.map(page => ({
        title: page.title,
        favorite: page.favorite,
      }));
      this.requestUpdate();
    });

    this.workspace.signals;
  }

  render() {
    return html`
      <form>
        <input type="text" name="page" placeholder="add a page" />
        <button type="button" @click=${this._createPage}>add</button>
      </form>
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
