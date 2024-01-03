import { MarkdownAdapter } from '@blocksuite/blocks';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { Job, type Page } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { copilotConfig } from '../copilot-service/copilot-config.js';
import {
  EmbeddingServiceKind,
  TextServiceKind,
} from '../copilot-service/service-base.js';
import type { AILogic } from '../logic.js';

type EmbeddedPage = {
  id: string;
  sections: {
    vector: number[];
    text: string;
  }[];
};

@customElement('chat-with-workspace-panel')
export class ChatWithWorkspacePanel extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    chat-with-workspace-panel {
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      width: 100%;
      font-family: var(--affine-font-family);
      height: 100%;
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
      background-color: white;
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
  logic!: AILogic;
  get editor() {
    return this.logic.editor;
  }
  @state()
  history: {
    role: 'user' | 'assistant';
    content: string;
    sources: {
      id: string;
      slice: string[];
    }[];
  }[] = [];

  @state()
  value = '';
  @state()
  syncedPages: EmbeddedPage[] = [];

  public override connectedCallback() {
    super.connectedCallback();
    this.disposables.add(
      this.editor.page.workspace.slots.pagesUpdated.on(() => {
        this.requestUpdate();
      })
    );
  }

  private ask = async () => {
    const value = this.value;
    this.history.push({ role: 'user', content: value, sources: [] });
    this.value = '';
    const [result] = await copilotConfig
      .getService('chat with workspace', EmbeddingServiceKind)
      .generateEmbeddings([value]);
    const list = this.syncedPages
      .flatMap(page => {
        return page.sections.map(section => ({
          id: page.id,
          distance: distance(result, section.vector),
          text: section.text,
        }));
      })
      .sort((a, b) => a.distance - b.distance)
      .filter(v => v.distance < 0.7)
      .slice(0, 3);
    const r = await copilotConfig
      .getService('text completion', TextServiceKind)
      .generateText([
        {
          role: 'system',
          content: `the background is:\n${list.map(v => v.text).join('\n')}`,
        },
        ...this.history.map(v => ({ role: v.role, content: v.content })),
      ]);
    const refs: Record<
      string,
      {
        slice: string[];
      }
    > = {};
    list.forEach(v => {
      const ref = refs[v.id] ?? (refs[v.id] = { slice: [] });
      ref.slice.push(v.text);
    });
    this.history.push({
      role: 'assistant',
      content: r ?? '',
      sources: Object.entries(refs).map(([id, ref]) => ({
        id,
        slice: ref.slice,
      })),
    });
    this.requestUpdate();
  };

  splitPage = async (page: Page): Promise<string[]> => {
    const markdown = await pageToMarkdown(page);
    return splitText(markdown);
  };

  embeddingPages = async (pageList: Page[]): Promise<EmbeddedPage[]> => {
    const result: Record<string, EmbeddedPage> = {};
    const list = (
      await Promise.all(
        pageList.map(async page =>
          (await this.splitPage(page)).map(v => ({ id: page.id, text: v }))
        )
      )
    ).flat();
    const vectors = await copilotConfig
      .getService('chat with workspace', EmbeddingServiceKind)
      .generateEmbeddings(list.map(v => v.text));
    list.forEach((v, i) => {
      const page = result[v.id] ?? (result[v.id] = { id: v.id, sections: [] });
      page.sections.push({ vector: vectors[i], text: v.text });
    });
    return Object.values(result);
  };

  syncWorkspace = async () => {
    this.syncedPages = await this.embeddingPages([
      ...this.editor.page.workspace.pages.values(),
    ]);
  };

  protected override render(): unknown {
    return html`
      <div class="sync-workspace-button" @click="${this.syncWorkspace}">
        Sync Workspace
      </div>
      <div class="synced-page-list">
        <div style="margin-bottom: 8px;">Synced pages:</div>
        ${this.syncedPages.length
          ? repeat(this.syncedPages, page => {
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
      <div
        style="display:flex;flex-direction: column;gap: 12px;margin-top: 12px;"
      >
        <div style="display:flex;gap: 8px;flex-direction: column">
          <div
            style="font-size: 12px;color:var(--affine-text-secondary-color);"
          >
            embedding service:
          </div>
          <vendor-service-select
            .featureKey="${'chat with workspace'}"
            .service="${EmbeddingServiceKind}"
          ></vendor-service-select>
        </div>
        <div style="display:flex;gap: 8px;flex-direction: column">
          <div
            style="font-size: 12px;color:var(--affine-text-secondary-color);"
          >
            chat service:
          </div>
          <vendor-service-select
            .featureKey="${'chat with workspace'}"
            .service="${TextServiceKind}"
          ></vendor-service-select>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'chat-with-workspace-panel': ChatWithWorkspacePanel;
  }
}

const pageToMarkdown = async (page: Page) => {
  const job = new Job({ workspace: page.workspace });
  const snapshot = await job.pageToSnapshot(page);
  const result = await new MarkdownAdapter().fromPageSnapshot({
    snapshot,
    assets: job.assetsManager,
  });
  return result.file;
};
const distance = (a: number[], b: number[]) => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
};

const split = (text: string, n: number) => {
  const result: string[] = [];
  while (text.length) {
    result.push(text.slice(0, n));
    text = text.slice(n);
  }
  return result;
};
const maxChunk = 300;
const splitText = (text: string) => {
  const data = text.split(/(?<=[\n。，.,])/).flatMap(s => {
    if (s.length > maxChunk) {
      return split(s, Math.ceil(s.length / maxChunk));
    }
    return [s];
  });
  const result: string[] = [];
  let current = '';
  for (const item of data) {
    if (current.length + item.length > maxChunk) {
      result.push(current);
      current = '';
    }
    current += item;
  }
  if (current.length) {
    result.push(current);
  }
  return result;
};
