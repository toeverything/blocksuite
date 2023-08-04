import { NavigationPanel } from '@blocksuite/blocks';
import type { EditorContainer } from '@blocksuite/editor';
import { WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

NavigationPanel;

@customElement('custom-navigation-panel')
export class CustomNavigationPanel extends WithDisposable(LitElement) {
  static override styles = css`
    .custom-navigation-container {
      position: absolute;
      top: 0;
      right: 0;
      border: 1px solid var(--affine-border-color, #e3e2e4);
      background: var(--affine-background-overlay-panel-color);
      height: 100vh;
      width: 300px;
      box-sizing: border-box;
      overflow-y: scroll;
      overflow-x: visible;
    }
  `;
  @state()
  private _show = true;

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  editor!: EditorContainer;

  private _switchPage({ pageId }: { pageId: string }) {
    if (this.page && this.page.id !== pageId) {
      const newPage = this.editor.page.workspace.getPage(pageId);
      if (newPage) {
        this.page = newPage;
      }
    }
  }

  private _renderPanel() {
    return html`<edgeless-navigation-panel
      .page=${this.page}
    ></edgeless-navigation-panel>`;
  }

  public toggleDisplay() {
    this._show = !this._show;
  }

  override connectedCallback(): void {
    super.connectedCallback();

    this._disposables.add(
      this.editor.slots.pageLinkClicked.on(this._switchPage)
    );
    this.page = this.editor.page;
  }

  override render() {
    return html`
      ${this._show
        ? html`
            <div class="custom-navigation-container">
              ${this._renderPanel()}
            </div>
          `
        : null}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'custom-navigation-panel': CustomNavigationPanel;
  }
}
