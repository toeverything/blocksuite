import type { PageMeta, Workspace } from '../workspace';
import { LitElement, html, PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

@customElement('test-app')
export class TestApp extends LitElement {
  workspace!: Workspace;

  @property()
  pages: Pick<PageMeta, 'title' | 'favorite'>[] = [];

  @query('input[name="page"]')
  input!: HTMLInputElement;

  private _toggleFavorite(index: number) {
    const { id } = this.workspace.meta.pages[index];
    this.workspace.setPageMeta(id, { favorite: !this.pages[index].favorite });
  }

  private _createPage() {
    const page = this.workspace.createPage(`${this.pages.length}`);
    this.workspace.setPageMeta(page.id, { title: this.input.value });
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
