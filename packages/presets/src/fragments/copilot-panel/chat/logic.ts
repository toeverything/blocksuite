import type { EditorHost } from '@blocksuite/block-std';
import {
  BlocksUtils,
  EmbedHtmlBlockSpec,
  MarkdownAdapter,
  type ShapeElementModel,
  SurfaceBlockComponent,
  type TreeNodeWithId,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import { type BlockSnapshot, type Doc, Job } from '@blocksuite/store';

import { LANGUAGE, TONE } from '../config.js';
import { copilotConfig } from '../copilot-service/copilot-config.js';
import { EmbeddingServiceKind } from '../copilot-service/service-base.js';
import {
  runAnalysisAction,
  runChangeToneAction,
  runFixSpellingAction,
  runGenerateAction,
  runImproveWritingAction,
  runMakeLongerAction,
  runMakeShorterAction,
  runPartAnalysisAction,
  runPPTGenerateAction,
  runRefineAction,
  runSimplifyWritingAction,
  runSummaryAction,
  runTranslateAction,
} from '../doc/actions.js';
import { getChatService } from '../doc/api.js';
import { genHtml } from '../edgeless/gen-html.js';
import type { AILogic } from '../logic.js';
import { findLeaf, findTree, getConnectorPath } from '../utils/connector.js';
import {
  insertFromMarkdown,
  markdownToSnapshot,
} from '../utils/markdown-utils.js';
import {
  getEdgelessRootFromEditor,
  getEdgelessService,
  getRootService,
  getSelectedTextContent,
  getSurfaceElementFromEditor,
  selectedToCanvas,
  selectedToPng,
} from '../utils/selection-utils.js';
import { basicTheme, type PPTDoc, type PPTSection } from './template.js';

export type ChatReactiveData = {
  history: ChatMessage[];
  syncedDocs: EmbeddedDoc[];
  value: string;
  currentRequest?: number;
  tempMessage?: string;
};

export class AIChatLogic {
  constructor(
    private logic: AILogic,
    private getHost: () => EditorHost
  ) {
    this.logic;
  }

  get loading() {
    return this.reactiveData.currentRequest != null;
  }

  get host() {
    return this.getHost();
  }

  reactiveData!: ChatReactiveData;
  private requestId = 0;

  async startRequest<T>(p: () => Promise<T>): Promise<T> {
    const id = this.requestId++;
    this.reactiveData.currentRequest = id;
    try {
      const result = await p();
      if (id === this.reactiveData.currentRequest) {
        return result;
      }
    } finally {
      this.reactiveData.currentRequest = undefined;
    }
    return new Promise(() => {});
  }

  getSelectedText = async () => {
    const text = await getSelectedTextContent(this.host);
    return text;
  };

  selectTextForBackground = async () => {
    const text = await this.getSelectedText();
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
    const canvas = await selectedToCanvas(this.host);
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

  splitDoc = async (doc: Doc): Promise<string[]> => {
    const markdown = await docToMarkdown(doc);
    return splitText(markdown);
  };

  embeddingDocs = async (docList: Doc[]): Promise<EmbeddedDoc[]> => {
    const result: Record<string, EmbeddedDoc> = {};
    const list = (
      await Promise.all(
        docList.map(async doc =>
          (await this.splitDoc(doc)).map(v => ({ id: doc.id, text: v }))
        )
      )
    ).flat();
    const vectors = await copilotConfig
      .getService('chat with workspace', EmbeddingServiceKind)
      .generateEmbeddings(list.map(v => v.text));
    list.forEach((v, i) => {
      const doc = result[v.id] ?? (result[v.id] = { id: v.id, sections: [] });
      doc.sections.push({ vector: vectors[i], text: v.text });
    });
    return Object.values(result);
  };

  syncWorkspace = async () => {
    this.reactiveData.syncedDocs = await this.embeddingDocs(
      [...this.host.doc.collection.docs.values()].map(v => v.getDoc())
    );
  };

  get docs() {
    return [...this.host.doc.collection.docs.values()];
  }

  async docBackground(): Promise<ChatMessage[]> {
    return [
      {
        role: 'system',
        content: `the background is:\n${await Promise.all(this.docs.map(v => docToMarkdown(v.getDoc()))).then(list => list.join('\n'))}`,
      },
    ];
  }

  genAnswer = async (text: string) => {
    if (this.loading) {
      return;
    }
    this.reactiveData.history = [
      ...this.reactiveData.history,
      {
        role: 'user',
        content: [{ text: text, type: 'text' }],
      },
    ];
    const background = await this.getBackground();
    this.reactiveData.value = '';
    const r = await this.startRequest(async () => {
      const iter = getChatService().chat([
        ...(await this.docBackground()),
        ...background.messages,
        ...this.reactiveData.history,
      ]);
      let result = '';
      for await (const item of iter) {
        result += item;
        this.reactiveData.tempMessage = result;
      }
      this.reactiveData.tempMessage = undefined;
      return result;
    });
    this.reactiveData.history = [
      ...this.reactiveData.history,
      {
        role: 'assistant',
        content: r ?? '',
        sources: background.sources,
      },
    ];
  };

  async getBackground(): Promise<{
    messages: ChatMessage[];
    sources: BackgroundSource[];
  }> {
    if (this.reactiveData.syncedDocs.length === 0) {
      return {
        messages: [],
        sources: [],
      };
    }
    const [result] = await copilotConfig
      .getService('chat with workspace', EmbeddingServiceKind)
      .generateEmbeddings([this.reactiveData.value]);
    const list = this.reactiveData.syncedDocs
      .flatMap(doc => {
        return doc.sections.map(section => ({
          id: doc.id,
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
    const selectedBlocks = getRootService(this.host).selectedBlocks;
    if (!selectedBlocks.length) return;

    const firstBlock = selectedBlocks[0];
    const parentBlock = firstBlock.parentBlockElement;

    // update selected block
    const firstIndex = parentBlock.model.children.findIndex(
      child => child.id === firstBlock.model.id
    ) as number;
    selectedBlocks.forEach(block => {
      this.host.doc.deleteBlock(block.model);
    });

    const models = await insertFromMarkdown(
      this.host,
      text,
      parentBlock.model.id,
      firstIndex
    );
    setTimeout(() => {
      const selections = models
        .map(model => model.id)
        .map(blockId => this.host.selection.create('block', { blockId }));
      this.host.selection.setGroup('note', selections);
    }, 0);
  }

  async insertBelowSelectedContent(text: string) {
    if (!text) return;

    const selectedBlocks = getRootService(this.host).selectedBlocks;
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
      const selections = models
        .map(model => model.id)
        .map(blockId => this.host.selection.create('block', { blockId }));
      this.host.selection.setGroup('note', selections);
    }, 0);
  }

  createAction(
    name: string,
    action: (
      input: string,
      background: ChatMessage[]
    ) => Promise<AsyncIterable<string>> | AsyncIterable<string>
  ) {
    return async (text?: string): Promise<void> => {
      const input = text ? text : await this.getSelectedText();
      if (!input) {
        return;
      }
      this.reactiveData.history = [
        ...this.reactiveData.history,
        {
          role: 'user',
          content: [{ text: input, type: 'text' }],
        },
        {
          role: 'user',
          content: [{ text: name, type: 'text' }],
        },
      ];
      const result = await this.startRequest(async () => {
        const strings = await action(input, await this.docBackground());
        let r = '';
        for await (const item of strings) {
          r += item;
          this.reactiveData.tempMessage = r;
        }
        this.reactiveData.tempMessage = undefined;
        return r;
      });
      this.reactiveData.history = [
        ...this.reactiveData.history,
        {
          role: 'assistant',
          content: result,
          sources: [],
        },
      ];
    };
  }

  docSelectionActionList: AllAction[] = [
    {
      type: 'group',
      name: 'Translate',
      children: LANGUAGE.map(language => ({
        type: 'action',
        name: language,
        action: this.createAction(`Translate to ${language}`, input =>
          runTranslateAction({ input, language })
        ),
      })),
    },
    {
      type: 'group',
      name: 'Change tone',
      children: TONE.map(tone => ({
        type: 'action',
        name: tone,
        action: this.createAction(`Make more ${tone}`, input =>
          runChangeToneAction({ input, tone })
        ),
      })),
    },
    {
      type: 'action',
      name: 'Refine',
      action: this.createAction('Refine', input => runRefineAction({ input })),
    },
    {
      type: 'action',
      name: 'Generate',
      action: this.createAction('Generate', input =>
        runGenerateAction({ input })
      ),
    },
    {
      type: 'action',
      name: 'Summary',
      action: this.createAction('Summary', input =>
        runSummaryAction({ input })
      ),
    },
    {
      type: 'action',
      name: 'Improve writing',
      action: this.createAction('Improve writing', input =>
        runImproveWritingAction({ input })
      ),
    },
    {
      type: 'action',
      name: 'Fix spelling',
      action: this.createAction('Fix spelling', input =>
        runFixSpellingAction({ input })
      ),
    },
    {
      type: 'action',
      name: 'Make shorter',
      action: this.createAction('Make shorter', input =>
        runMakeShorterAction({ input })
      ),
    },
    {
      type: 'action',
      name: 'Make longer',
      action: this.createAction('Make longer', input =>
        runMakeLongerAction({ input })
      ),
    },
    {
      type: 'action',
      name: 'Simplify language',
      action: this.createAction('Simplify language', input =>
        runSimplifyWritingAction({ input })
      ),
    },
    {
      type: 'action',
      name: 'Create mind-map',
      action: this.createAction('Create mind-map', (input, background) => {
        const service = getEdgelessService(this.host);
        const [x, y] = [service.viewport.centerX, service.viewport.centerY];
        const reactiveData = this.reactiveData;
        const build = mindMapBuilder(this.host, x, y);
        return (async function* () {
          const strings = runAnalysisAction({ input, background });
          let text = '';
          for await (const item of strings) {
            yield item;
            text += item;
            if (text) {
              await build(text);
            }
            reactiveData.tempMessage = text;
          }
        })();
      }),
    },
    {
      type: 'action',
      name: 'Create presentation',
      action: this.createAction('Create mind-map', (input, background) => {
        const reactiveData = this.reactiveData;
        const build = pptBuilder(this.host);
        return (async function* () {
          const strings = runPPTGenerateAction({ input, background });
          let text = '';
          for await (const item of strings) {
            yield item;
            text += item;
            if (text) {
              await build.process(text);
            }
            reactiveData.tempMessage = text;
          }
          await build.done(text);
        })();
      }),
    },
    {
      type: 'action',
      name: 'Insert into Chat',
      action: async () => {
        const input = await this.getSelectedText();
        if (!input) {
          return;
        }
        this.reactiveData.history = [
          ...this.reactiveData.history,
          {
            role: 'user',
            content: [{ text: input, type: 'text' }],
          },
        ];
      },
    },
  ];
  edgelessSelectionActionList: AllAction[] = [
    {
      type: 'action',
      name: 'Create mind-map',
      hide: () => {
        const service = getEdgelessService(this.host);
        const ele = service.selection.elements[0];
        return !SurfaceBlockComponent.isShape(ele);
      },
      action: async () => {
        const reactiveData = this.reactiveData;
        const service = getEdgelessService(this.host);
        const ele = service.selection.elements[0];
        if (!SurfaceBlockComponent.isShape(ele)) {
          return;
        }
        const text = ele.text?.toString();
        if (!text) {
          return;
        }
        const pathIds = getConnectorPath(ele.id, service);
        const rootId = [...pathIds, ele.id][0];
        const rootEle = service.getElementById(rootId) as ShapeElementModel;
        const path = pathIds.map(id => {
          const ele = service.getElementById(id);
          if (ele && SurfaceBlockComponent.isShape(ele)) {
            return ele.text?.toString() ?? '';
          }
          return '';
        });
        const oldTree = findTree(rootId, service);
        const target = findLeaf(oldTree, ele.id);
        assertExists(target);
        const build = mindMapBuilder(
          this.host,
          rootEle.x,
          rootEle.y,
          ele.id,
          tree => {
            target.children = tree.children;
            return oldTree;
          }
        );
        await this.createAction('Part analysis', (input, background) => {
          return (async function* () {
            const strings = runPartAnalysisAction({ input, path, background });
            let text = '';
            for await (const item of strings) {
              yield item;
              text += item;
              if (text) {
                await build(text);
              }
              reactiveData.tempMessage = text;
            }
          })();
        })(text);
      },
    },
    {
      type: 'action',
      name: 'Make it real',
      hide: () => {
        const service = getEdgelessService(this.host);
        const elements = service.selection.elements;
        return elements.length === 0;
      },
      action: async () => {
        const img = await selectedToPng(this.host);
        if (!img) return;

        const html = await genHtml(img);
        if (!html) return;

        const edgelessRoot = getEdgelessRootFromEditor(this.host);
        edgelessRoot.doc.addBlock(
          EmbedHtmlBlockSpec.schema.model.flavour as 'affine:embed-html',
          { html, design: img, xywh: '[0, 400, 400, 200]' },
          edgelessRoot.surface.model.id
        );
      },
    },
  ];
}

type Action = {
  type: 'action';
  name: string;
  hide?: () => boolean;
  action: () => Promise<void>;
};
type ActionGroup = {
  type: 'group';
  name: string;
  children: AllAction[];
};
export type AllAction = Action | ActionGroup;
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

const docToMarkdown = async (doc: Doc) => {
  const job = new Job({ collection: doc.collection });
  const snapshot = await job.docToSnapshot(doc);
  const result = await new MarkdownAdapter().fromDocSnapshot({
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
export type EmbeddedDoc = {
  id: string;
  sections: {
    vector: number[];
    text: string;
  }[];
};
const mindMapBuilder = (
  host: EditorHost,
  x: number,
  y: number,
  rootId?: string,
  wrapTree?: (tree: TreeNodeWithId) => TreeNodeWithId
) => {
  const service = getEdgelessService(host);
  const ids: string[] = rootId ? [rootId] : [];
  const buildTree = async (text: string) => {
    const snapshot = await markdownToSnapshot(text, host);
    const block = snapshot.snapshot.content[0];
    let i = 0;
    const toTreeNode = (
      block: BlockSnapshot,
      parentId?: string
    ): TreeNodeWithId => {
      const text = getText(block);
      if (ids[i] == null) {
        ids[i] = BlocksUtils.mindMap.createNode(
          text,
          service,
          parentId ? { direction: 'right', parentId } : undefined
        );
      }
      const selfId = ids[i];
      const shape = service.getElementById(selfId) as ShapeElementModel;
      if (shape.text?.toString() !== text) {
        BlocksUtils.mindMap.changeText(selfId, text, service);
      }
      return {
        id: ids[i++],
        children: block.children.map(id => toTreeNode(id, selfId)),
      };
    };
    const tree = toTreeNode(block.children[0]);
    BlocksUtils.mindMap.layoutInEdgeless(service, wrapTree?.(tree) ?? tree, {
      x,
      y,
    });
  };
  return buildTree;
};
const createTaskQueue = () => {
  const queue: Array<() => Promise<void>> = [];
  let current: Promise<void> | undefined;
  const runTask = () => {
    if (current) {
      return;
    }
    const task = queue.shift();
    if (!task) {
      return;
    }
    current = task().finally(() => {
      current = undefined;
      runTask();
    });
  };
  return {
    add: (task: () => Promise<void>) => {
      queue.push(task);
      runTask();
    },
  };
};
const addPPTTaskQueue = createTaskQueue();
const pptBuilder = (host: EditorHost) => {
  const service = getEdgelessService(host);
  const docs: PPTDoc[] = [];
  const addDoc = async (block: BlockSnapshot) => {
    const sections = block.children.map(v => {
      const title = getText(v);
      const keywords = getText(v.children[0]);
      const content = getText(v.children[1]);
      return {
        title,
        keywords,
        content,
      } satisfies PPTSection;
    });
    const doc: PPTDoc = {
      isCover: docs.length === 0,
      title: getText(block),
      sections,
    };
    docs.push(doc);
    const job = service.createTemplateJob('template');
    const { images, content } = await basicTheme(doc);
    if (images.length) {
      await Promise.all(
        images.map(({ id, url }) =>
          fetch(url)
            .then(res => res.blob())
            .then(blob => job.job.assets.set(id, blob))
        )
      );
    }
    await job.insertTemplate(content);
    getSurfaceElementFromEditor(host).refresh();
  };
  return {
    process: async (text: string) => {
      const snapshot = await markdownToSnapshot(text, host);
      const block = snapshot.snapshot.content[0];
      if (block.children.length > docs.length + 1) {
        addPPTTaskQueue.add(() => addDoc(block.children[docs.length]));
      }
    },
    done: async (text: string) => {
      const snapshot = await markdownToSnapshot(text, host);
      const block = snapshot.snapshot.content[0];
      addPPTTaskQueue.add(() =>
        addDoc(block.children[block.children.length - 1])
      );
    },
  };
};
const getText = (block: BlockSnapshot) => {
  // @ts-ignore
  return block.props.text?.delta?.[0]?.insert ?? '';
};
