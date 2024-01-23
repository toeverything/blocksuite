import { CloseIcon, createDefaultPage } from '@blocksuite/blocks';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { AffineEditorContainer } from '@blocksuite/presets';
import type { Workspace } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

@customElement('pages-panel')
export class PagesPanel extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    pages-panel {
      display: flex;
      flex-direction: column;
      width: 100%;
      background-color: var(--affine-background-secondary-color);
      font-family: var(--affine-font-family);
      height: 100%;
      padding: 12px;
      gap: 4px;
    }
    .page-item:hover .delete-page-icon {
      display: flex;
    }
    .delete-page-icon {
      display: none;
      padding: 2px;
      border-radius: 4px;
    }
    .delete-page-icon:hover {
      background-color: var(--affine-hover-color);
    }
    .delete-page-icon svg {
      width: 14px;
      height: 14px;
      color: var(--affine-secondary-color);
      fill: var(--affine-secondary-color);
    }
    .new-page-button {
      margin-bottom: 16px;
      border: 1px solid var(--affine-border-color);
      border-radius: 4px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .new-page-button:hover {
      background-color: var(--affine-hover-color);
    }
  `;
  @property({ attribute: false })
  editor!: AffineEditorContainer;

  public override connectedCallback() {
    super.connectedCallback();
    this.disposables.add(
      this.editor.page.workspace.slots.pagesUpdated.on(() => {
        this.requestUpdate();
      })
    );
  }

  createPage = () => {
    createPageBlock(this.editor.page.workspace);
  };

  protected override render(): unknown {
    const workspace = this.editor.page.workspace;
    const pages = [...workspace.pages.values()];
    return html`
      <div @click="${this.createPage}" class="new-page-button">New Page</div>
      ${repeat(
        pages,
        v => v.id,
        page => {
          const style = styleMap({
            backgroundColor:
              this.editor.page.id === page.id
                ? 'var(--affine-hover-color)'
                : undefined,
            padding: '4px 4px 4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
          });
          const click = () => {
            this.editor.page = page;
            this.requestUpdate();
          };
          const deletePage = () => {
            workspace.removePage(page.id);
            // When delete a page, we need to set the editor page to the first remaining page
            const pages = Array.from(workspace.pages.values());
            this.editor.page = pages[0];
            this.requestUpdate();
          };
          return html`<div class="page-item" @click="${click}" style="${style}">
            ${page.meta.title || 'Untitled'}
            <div @click="${deletePage}" class="delete-page-icon">
              ${CloseIcon}
            </div>
          </div>`;
        }
      )}
    `;
  }
}

function createPageBlock(workspace: Workspace) {
  const id = workspace.idGenerator();
  createDefaultPage(workspace, { id }).catch(console.error);
}

declare global {
  interface HTMLElementTagNameMap {
    'pages-panel': PagesPanel;
  }
}
