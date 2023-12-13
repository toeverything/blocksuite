import { MarkdownAdapter } from '@blocksuite/blocks';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { AffineEditorContainer } from '@blocksuite/presets';
import { Job, nanoid, type Page } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

@customElement('chat-with-workspace-panel')
export class ChatWithWorkspacePanel extends WithDisposable(ShadowlessElement) {
  static AnythingLLMKey = 'Bearer TTNZTTF-S284WG9-KP6CNSV-SX08ZB6';
  static Workspace = 'demo1';
  static override styles = css`
    chat-with-workspace-panel {
      display: flex;
      flex-direction: column;
      width: 100%;
      background-color: white;
      border-left: 1px solid var(--affine-border-color);
      font-family: var(--affine-font-family);
      height: 100%;
      padding: 12px;
      gap: 4px;
    }

    .chat-with-workspace-prompt-container {
      display: flex;
      gap: 8px;
      height: 30px;
      margin-top: 24px;
    }

    .chat-with-workspace-prompt {
      flex: 1;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      outline: none;
      background-color: var(--affine-background-secondary-color);
    }

    .send-button {
      width: 36px;
      background-color: var(--affine-primary-color);
      border-radius: 4px;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .sync-workspace-button {
      border: 1px solid var(--affine-border-color);
      height: 32px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .synced-page-list {
      margin-bottom: 14px;
      color: var(--affine-text-secondary-color);
      font-size: 12px;
    }

    .history-item {
      display: flex;
      flex-direction: column;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 14px;
    }

    .history-refs {
      font-size: 12px;
      color: var(--affine-text-secondary-color);
    }
  `;
  @property({ attribute: false })
  editor!: AffineEditorContainer;

  @state()
  history: {
    role: 'user' | 'assistant';
    content: string;
    sources: {
      id: string;
      slice: string;
    }[];
  }[] = [
    {
      role: 'assistant',
      content: 'Welcome to Affine!',
      sources: [{ id: 'page:home', slice: '' }],
    },
  ];

  @state()
  syncedPageList: {
    path: string;
    id: string;
  }[] = [];

  @state()
  value = '';
  titleToPageId = new Map<string, string>();
  docs: {
    path: string;
    name: string;
    title: string;
    id: string;
  }[] = [];

  public override connectedCallback() {
    super.connectedCallback();
    this.disposables.add(
      this.editor.page.workspace.slots.pagesUpdated.on(() => {
        this.requestUpdate();
      })
    );
    this.refreshSyncedPageList().then(() => {
      this.removeAllDocs();
    });
    this.refreshChats();
  }

  private ask = async () => {
    const value = this.value;
    this.value = '';
    await fetch(
      `http://localhost:3001/api/v1/workspace/${ChatWithWorkspacePanel.Workspace}/chat`,
      {
        method: 'POST',
        headers: {
          contentType: 'application/json',
          Authorization: ChatWithWorkspacePanel.AnythingLLMKey,
        },
        body: JSON.stringify({ message: value, mode: 'chat' }),
      }
    ).then(res => res.json());
    await this.refreshChats();
  };

  uploadPage = async (page: Page) => {
    const markdown = await pageToMarkdown(page);
    const title = nanoid('unknown');
    this.titleToPageId.set(title, page.id);
    const fileName = `${title}.md`;
    const file = new File([markdown], fileName, { type: 'text/plain' });
    const form = new FormData();
    form.append('file', file);
    await fetch('http://localhost:3001/api/v1/document/upload', {
      method: 'POST',
      headers: {
        contentType: 'multipart/form-data',
        Authorization: ChatWithWorkspacePanel.AnythingLLMKey,
      },
      body: form,
    }).then(res => res.json());
    return title;
  };

  refreshChats = async () => {
    const data: {
      history: {
        role: 'user' | 'assistant';
        content: string;
        sources?: {
          title: string;
        }[];
      }[];
    } = await fetch(
      `http://localhost:3001/api/v1/workspace/${ChatWithWorkspacePanel.Workspace}/chats`,
      {
        headers: {
          contentType: 'application/json',
          Authorization: ChatWithWorkspacePanel.AnythingLLMKey,
        },
      }
    ).then(res => res.json());
    this.history = data.history.map(v => ({
      role: v.role,
      content: v.content,
      sources:
        v.sources?.flatMap(source => {
          const id = this.titleToPageId.get(source.title);
          if (id && this.editor.page.workspace.getPage(id)) {
            return [
              {
                id: id ?? '',
                slice: '',
              },
            ];
          }
          return [];
        }) ?? [],
    }));
  };
  refreshDocs = async () => {
    const data = await fetch('http://localhost:3001/api/v1/documents', {
      headers: {
        contentType: 'application/json',
        Authorization: ChatWithWorkspacePanel.AnythingLLMKey,
      },
    }).then(res => res.json());
    type File = {
      name: string;
      type: 'file';
      id: string;
      title: string;
    };
    type Folder = {
      type: 'folder';
      items: Item[];
      name: string;
    };
    type Item = Folder | File;
    const process = (path: string, item: Item) => {
      if (item.type === 'file') {
        this.docs.push({
          path: path ? `${path}/${item.name}` : item.name,
          name: item.name,
          title: item.title,
          id: item.id,
        });
      } else {
        item.items.forEach(subItem => process(`${path}/${item.name}`, subItem));
      }
    };
    this.docs = [];
    data.localFiles.items.forEach(item => process('', item));
  };
  refreshSyncedPageList = async () => {
    const data = await fetch(
      `http://localhost:3001/api/v1/workspace/${ChatWithWorkspacePanel.Workspace}`,
      {
        headers: {
          contentType: 'application/json',
          Authorization: ChatWithWorkspacePanel.AnythingLLMKey,
        },
      }
    ).then(res => res.json());
    const documents = data.workspace.documents;
    this.syncedPageList = documents.map(doc => {
      const pageId = this.titleToPageId.get(
        this.docs.find(v => v.path === doc.docpath)?.title ?? ''
      );
      return {
        id: pageId,
        path: doc.docpath,
      };
    });
  };
  syncWorkspace = async () => {
    await this.removeAllDocs();
    const list = await Promise.allSettled(
      [...this.editor.page.workspace.pages.values()].map(page =>
        this.uploadPage(page)
      )
    );
    await this.refreshDocs();
    const names = list.flatMap(name => {
      if (name.status === 'fulfilled') {
        const v = this.docs.find(doc => doc.title === name.value);
        return v ? [v.path] : [];
      }
      return [];
    });
    await fetch(
      `http://localhost:3001/api/v1/workspace/${ChatWithWorkspacePanel.Workspace}/update-embeddings`,
      {
        method: 'POST',
        headers: {
          Authorization: ChatWithWorkspacePanel.AnythingLLMKey,
        },
        body: JSON.stringify({
          adds: names,
        }),
      }
    ).then(res => res.json());
    await this.refreshSyncedPageList();
  };

  protected override render(): unknown {
    return html`
      <div class="sync-workspace-button" @click="${this.syncWorkspace}">
        Sync Workspace
      </div>
      <div class="synced-page-list">
        <div style="margin-bottom: 8px;">Synced pages:</div>
        ${this.syncedPageList.length
          ? repeat(this.syncedPageList, page => {
              const title =
                this.editor.page.workspace.getPage(page.id)?.meta.title ??
                'Untitled';
              return html` <div>${title}</div>`;
            })
          : 'Empty'}
      </div>
      ${repeat(this.history, data => {
        const style = styleMap({
          alignItems: data.role === 'user' ? 'flex-end' : 'flex-start',
          backgroundColor:
            data.role === 'user' ? undefined : 'var(--affine-hover-color)',
        });
        return html` <div class="history-item" style="${style}">
          <div style="width: fit-content">${data.content}</div>
          ${data.sources?.length
            ? html` <div class="history-refs">
                <div style="margin-top: 8px;">sources:</div>
                <div
                  style="display: flex;flex-direction: column;gap: 4px;padding: 4px;"
                >
                  ${repeat(data.sources, ref => {
                    const page = this.editor.page.workspace.getPage(ref.id);
                    if (!page) {
                      return;
                    }
                    const title = page.meta.title || 'Untitled';
                    const jumpTo = () => {
                      this.editor.page = page;
                    };
                    return html` <a @click="${jumpTo}" style="cursor: pointer"
                      >${title}</a
                    >`;
                  })}
                </div>
              </div>`
            : null}
        </div>`;
      })}
      <div class="chat-with-workspace-prompt-container">
        <input
          placeholder="Prompt"
          type="text"
          class="chat-with-workspace-prompt"
          .value="${this.value}"
          @input="${(e: InputEvent) => {
            this.value = (e.target as HTMLInputElement).value;
          }}"
        />
        <div @click="${this.ask}" class="send-button">
          <sl-icon name="stars"></sl-icon>
        </div>
      </div>
    `;
  }

  private async removeAllDocs() {
    await fetch(
      `http://localhost:3001/api/v1/workspace/${ChatWithWorkspacePanel.Workspace}/update-embeddings`,
      {
        method: 'POST',
        headers: {
          Authorization: ChatWithWorkspacePanel.AnythingLLMKey,
        },
        body: JSON.stringify({
          deletes: this.syncedPageList.map(v => v.path),
        }),
      }
    ).then(res => res.json());
    await this.refreshSyncedPageList();
  }
}

const pageToMarkdown = async (page: Page) => {
  const job = new Job({ workspace: page.workspace });
  const snapshot = await job.pageToSnapshot(page);
  console.log(snapshot);
  const result = await new MarkdownAdapter().fromPageSnapshot({
    snapshot,
    assets: job.assetsManager,
  });
  return result.file;
};
