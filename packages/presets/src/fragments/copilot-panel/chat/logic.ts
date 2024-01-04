import { MarkdownAdapter } from '@blocksuite/blocks';
import { Job, type Page } from '@blocksuite/store';
import type { OpenAI } from 'openai';

import type { AffineEditorContainer } from '../../../editors/index.js';
import { copilotConfig } from '../copilot-service/copilot-config.js';
import { EmbeddingServiceKind } from '../copilot-service/service-base.js';
import { getChatService } from '../doc/api.js';
import { insertFromMarkdown } from '../utils/markdown-utils.js';
import {
  getSelectedBlocks,
  getSelectedTextContent,
  selectedToCanvas,
} from '../utils/selection-utils.js';

export type ChatReactiveData = {
  history: ChatMessage[];
  loading: boolean;
  syncedPages: EmbeddedPage[];
  value: string;
};

export class AIChatLogic {
  constructor(private editor: AffineEditorContainer) {}

  get host() {
    return this.editor.host;
  }

  reactiveData!: ChatReactiveData;

  selectTextForBackground = async () => {
    const text = await getSelectedTextContent(this.editor.host);
    if (!text) return;
    this.reactiveData.history.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text,
        },
      ],
    });
  };

  selectShapesForBackground = async () => {
    const canvas = await selectedToCanvas(this.editor);
    if (!canvas) {
      alert('Please select some shapes first');
      return;
    }
    const url = canvas.toDataURL();
    this.reactiveData.history.push({
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url,
          },
        },
      ],
    });
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
    this.reactiveData.syncedPages = await this.embeddingPages([
      ...this.editor.page.workspace.pages.values(),
    ]);
  };

  genAnswer = async () => {
    if (this.reactiveData.loading) {
      return;
    }
    this.reactiveData.loading = true;
    try {
      const value = this.reactiveData.value;
      this.reactiveData.history.push({
        role: 'user',
        content: [{ text: value, type: 'text' }],
      });
      const background = await this.getBackground();
      this.reactiveData.value = '';
      const r = await getChatService().chat([
        ...background.messages,
        ...toGPTMessages(this.reactiveData.history),
      ]);

      this.reactiveData.history.push({
        role: 'assistant',
        content: r ?? '',
        sources: background.sources,
      });
    } finally {
      this.reactiveData.loading = false;
    }
  };

  async getBackground(): Promise<{
    messages: ChatMessage[];
    sources: BackgroundSource[];
  }> {
    if (this.reactiveData.syncedPages.length === 0) {
      return {
        messages: [],
        sources: [],
      };
    }
    const [result] = await copilotConfig
      .getService('chat with workspace', EmbeddingServiceKind)
      .generateEmbeddings([this.reactiveData.value]);
    const list = this.reactiveData.syncedPages
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
    const sources = new Map<string, string[]>();
    list.forEach(v => {
      let source = sources.get(v.id);
      if (!source) {
        source = [];
        sources.set(v.id, source);
      }
      source.push(v.text);
    });
    return {
      messages: [
        {
          role: 'system',
          content: `the background is:\n${list.map(v => v.text).join('\n')}`,
        },
      ],
      sources: [...sources.entries()].map(([id, textList]) => ({
        id,
        slice: textList,
      })),
    };
  }

  async replaceSelectedContent(text: string) {
    if (!text) return;
    const selectedBlocks = await getSelectedBlocks(this.host);
    if (!selectedBlocks.length) return;

    const firstBlock = selectedBlocks[0];
    const parentBlock = firstBlock.parentBlockElement;

    // update selected block
    const firstIndex = parentBlock.model.children.findIndex(
      child => child.id === firstBlock.model.id
    ) as number;
    selectedBlocks.forEach(block => {
      this.editor.page.deleteBlock(block.model);
    });

    const models = await insertFromMarkdown(
      this.host,
      text,
      parentBlock.model.id,
      firstIndex
    );
    setTimeout(() => {
      const parentPath = firstBlock.parentPath;
      const selections = models
        .map(model => [...parentPath, model.id])
        .map(path => this.host.selection.create('block', { path }));
      this.host.selection.setGroup('note', selections);
    }, 0);
  }

  async insertBelowSelectedContent(text: string) {
    if (!text) return;

    const selectedBlocks = await getSelectedBlocks(this.host);
    const blockLength = selectedBlocks.length;
    if (!blockLength) return;

    const lastBlock = selectedBlocks[blockLength - 1];
    const parentBlock = lastBlock.parentBlockElement;

    const lastIndex = parentBlock.model.children.findIndex(
      child => child.id === lastBlock.model.id
    ) as number;

    const models = await insertFromMarkdown(
      this.host,
      text,
      parentBlock.model.id,
      lastIndex + 1
    );

    setTimeout(() => {
      const parentPath = lastBlock.parentPath;
      const selections = models
        .map(model => [...parentPath, model.id])
        .map(path => this.host.selection.create('block', { path }));
      this.host.selection.setGroup('note', selections);
    }, 0);
  }
}

type MessageContent =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'image_url';
      image_url: {
        url: string;
      };
    };

type BackgroundSource = {
  id: string;
  slice: string[];
};
export type ChatMessage =
  | {
      role: 'user';
      content: MessageContent[];
    }
  | {
      role: 'system';
      content: string;
    }
  | {
      role: 'assistant';
      content: string;
      sources: BackgroundSource[];
    };

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
export type EmbeddedPage = {
  id: string;
  sections: {
    vector: number[];
    text: string;
  }[];
};

const toGPTMessages = (
  messages: ChatMessage[]
): Array<OpenAI.ChatCompletionMessageParam> => {
  return messages.map(v => {
    if (v.role === 'assistant') {
      return { role: v.role, content: v.content };
    }
    return v;
  });
};
