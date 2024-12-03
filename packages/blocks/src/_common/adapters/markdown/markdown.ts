import type { ExtensionType } from '@blocksuite/block-std';
import type { Root } from 'mdast';

import {
  DEFAULT_NOTE_BACKGROUND_COLOR,
  NoteDisplayMode,
} from '@blocksuite/affine-model';
import {
  type AdapterContext,
  type BlockMarkdownAdapterMatcher,
  BlockMarkdownAdapterMatcherIdentifier,
  type Markdown,
  type MarkdownAST,
  MarkdownDeltaConverter,
} from '@blocksuite/affine-shared/adapters';
import {
  type AssetsManager,
  ASTWalker,
  BaseAdapter,
  type BlockSnapshot,
  BlockSnapshotSchema,
  type DocSnapshot,
  type FromBlockSnapshotPayload,
  type FromBlockSnapshotResult,
  type FromDocSnapshotPayload,
  type FromDocSnapshotResult,
  type FromSliceSnapshotPayload,
  type FromSliceSnapshotResult,
  type Job,
  nanoid,
  type SliceSnapshot,
  type ToBlockSnapshotPayload,
  type ToDocSnapshotPayload,
} from '@blocksuite/store';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';

import { AdapterFactoryIdentifier } from '../type.js';
import { defaultBlockMarkdownAdapterMatchers } from './block-matcher.js';
import { inlineDeltaToMarkdownAdapterMatchers } from './delta-converter/inline-delta.js';
import { markdownInlineToDeltaMatchers } from './delta-converter/markdown-inline.js';
import { remarkGfm } from './gfm.js';

type MarkdownToSliceSnapshotPayload = {
  file: Markdown;
  assets?: AssetsManager;
  pageVersion: number;
  workspaceVersion: number;
  workspaceId: string;
  pageId: string;
};

export class MarkdownAdapter extends BaseAdapter<Markdown> {
  private _traverseMarkdown = (
    markdown: MarkdownAST,
    snapshot: BlockSnapshot,
    assets?: AssetsManager
  ) => {
    const walker = new ASTWalker<MarkdownAST, BlockSnapshot>();
    walker.setONodeTypeGuard(
      (node): node is MarkdownAST =>
        !Array.isArray(node) &&
        'type' in (node as object) &&
        (node as MarkdownAST).type !== undefined
    );
    walker.setEnter(async (o, context) => {
      for (const matcher of this.blockMatchers) {
        if (matcher.toMatch(o)) {
          const adapterContext: AdapterContext<
            MarkdownAST,
            BlockSnapshot,
            MarkdownDeltaConverter
          > = {
            walker,
            walkerContext: context,
            configs: this.configs,
            job: this.job,
            deltaConverter: this.deltaConverter,
            textBuffer: { content: '' },
            assets,
          };
          await matcher.toBlockSnapshot.enter?.(o, adapterContext);
        }
      }
    });
    walker.setLeave(async (o, context) => {
      for (const matcher of this.blockMatchers) {
        if (matcher.toMatch(o)) {
          const adapterContext: AdapterContext<
            MarkdownAST,
            BlockSnapshot,
            MarkdownDeltaConverter
          > = {
            walker,
            walkerContext: context,
            configs: this.configs,
            job: this.job,
            deltaConverter: this.deltaConverter,
            textBuffer: { content: '' },
            assets,
          };
          await matcher.toBlockSnapshot.leave?.(o, adapterContext);
        }
      }
    });
    return walker.walk(markdown, snapshot);
  };

  private _traverseSnapshot = async (
    snapshot: BlockSnapshot,
    markdown: MarkdownAST,
    assets?: AssetsManager
  ) => {
    const assetsIds: string[] = [];
    const walker = new ASTWalker<BlockSnapshot, MarkdownAST>();
    walker.setONodeTypeGuard(
      (node): node is BlockSnapshot =>
        BlockSnapshotSchema.safeParse(node).success
    );
    walker.setEnter(async (o, context) => {
      for (const matcher of this.blockMatchers) {
        if (matcher.fromMatch(o)) {
          const adapterContext: AdapterContext<
            BlockSnapshot,
            MarkdownAST,
            MarkdownDeltaConverter
          > = {
            walker,
            walkerContext: context,
            configs: this.configs,
            job: this.job,
            deltaConverter: this.deltaConverter,
            textBuffer: { content: '' },
            assets,
            updateAssetIds: (assetsId: string) => {
              assetsIds.push(assetsId);
            },
          };
          await matcher.fromBlockSnapshot.enter?.(o, adapterContext);
        }
      }
    });
    walker.setLeave(async (o, context) => {
      for (const matcher of this.blockMatchers) {
        if (matcher.fromMatch(o)) {
          const adapterContext: AdapterContext<
            BlockSnapshot,
            MarkdownAST,
            MarkdownDeltaConverter
          > = {
            walker,
            walkerContext: context,
            configs: this.configs,
            job: this.job,
            deltaConverter: this.deltaConverter,
            textBuffer: { content: '' },
            assets,
          };
          await matcher.fromBlockSnapshot.leave?.(o, adapterContext);
        }
      }
    });
    return {
      ast: (await walker.walk(snapshot, markdown)) as Root,
      assetsIds,
    };
  };

  deltaConverter: MarkdownDeltaConverter;

  constructor(
    job: Job,
    readonly blockMatchers: BlockMarkdownAdapterMatcher[] = defaultBlockMarkdownAdapterMatchers
  ) {
    super(job);
    this.deltaConverter = new MarkdownDeltaConverter(
      job.adapterConfigs,
      inlineDeltaToMarkdownAdapterMatchers,
      markdownInlineToDeltaMatchers
    );
  }

  private _astToMarkdown(ast: Root) {
    return unified()
      .use(remarkGfm)
      .use(remarkStringify, {
        resourceLink: true,
      })
      .use(remarkMath)
      .stringify(ast)
      .replace(/&#x20;\n/g, ' \n');
  }

  private _markdownToAst(markdown: Markdown) {
    return unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath)
      .parse(markdown);
  }

  async fromBlockSnapshot({
    snapshot,
    assets,
  }: FromBlockSnapshotPayload): Promise<FromBlockSnapshotResult<Markdown>> {
    const root: Root = {
      type: 'root',
      children: [],
    };
    const { ast, assetsIds } = await this._traverseSnapshot(
      snapshot,
      root,
      assets
    );
    return {
      file: this._astToMarkdown(ast),
      assetsIds,
    };
  }

  async fromDocSnapshot({
    snapshot,
    assets,
  }: FromDocSnapshotPayload): Promise<FromDocSnapshotResult<Markdown>> {
    let buffer = '';
    const { file, assetsIds } = await this.fromBlockSnapshot({
      snapshot: snapshot.blocks,
      assets,
    });
    buffer += file;
    return {
      file: buffer,
      assetsIds,
    };
  }

  async fromSliceSnapshot({
    snapshot,
    assets,
  }: FromSliceSnapshotPayload): Promise<FromSliceSnapshotResult<Markdown>> {
    let buffer = '';
    const sliceAssetsIds: string[] = [];
    for (const contentSlice of snapshot.content) {
      const root: Root = {
        type: 'root',
        children: [],
      };
      const { ast, assetsIds } = await this._traverseSnapshot(
        contentSlice,
        root,
        assets
      );
      sliceAssetsIds.push(...assetsIds);
      buffer += this._astToMarkdown(ast);
    }
    const markdown =
      buffer.match(/\n/g)?.length === 1 ? buffer.trimEnd() : buffer;
    return {
      file: markdown,
      assetsIds: sliceAssetsIds,
    };
  }

  async toBlockSnapshot(
    payload: ToBlockSnapshotPayload<Markdown>
  ): Promise<BlockSnapshot> {
    const markdownAst = this._markdownToAst(payload.file);
    const blockSnapshotRoot = {
      type: 'block',
      id: nanoid(),
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: DEFAULT_NOTE_BACKGROUND_COLOR,
        index: 'a0',
        hidden: false,
        displayMode: NoteDisplayMode.DocAndEdgeless,
      },
      children: [],
    };
    return this._traverseMarkdown(
      markdownAst,
      blockSnapshotRoot as BlockSnapshot,
      payload.assets
    );
  }

  async toDocSnapshot(
    payload: ToDocSnapshotPayload<Markdown>
  ): Promise<DocSnapshot> {
    const markdownAst = this._markdownToAst(payload.file);
    const blockSnapshotRoot = {
      type: 'block',
      id: nanoid(),
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: DEFAULT_NOTE_BACKGROUND_COLOR,
        index: 'a0',
        hidden: false,
        displayMode: NoteDisplayMode.DocAndEdgeless,
      },
      children: [],
    };
    return {
      type: 'page',
      meta: {
        id: nanoid(),
        title: 'Untitled',
        createDate: Date.now(),
        tags: [],
      },
      blocks: {
        type: 'block',
        id: nanoid(),
        flavour: 'affine:page',
        props: {
          title: {
            '$blocksuite:internal:text$': true,
            delta: [
              {
                insert: 'Untitled',
              },
            ],
          },
        },
        children: [
          {
            type: 'block',
            id: nanoid(),
            flavour: 'affine:surface',
            props: {
              elements: {},
            },
            children: [],
          },
          await this._traverseMarkdown(
            markdownAst,
            blockSnapshotRoot as BlockSnapshot,
            payload.assets
          ),
        ],
      },
    };
  }

  async toSliceSnapshot(
    payload: MarkdownToSliceSnapshotPayload
  ): Promise<SliceSnapshot | null> {
    let codeFence = '';
    payload.file = payload.file
      .split('\n')
      .map(line => {
        if (line.trimStart().startsWith('-')) {
          return line;
        }
        let trimmedLine = line.trimStart();
        if (!codeFence && trimmedLine.startsWith('```')) {
          codeFence = trimmedLine.substring(
            0,
            trimmedLine.lastIndexOf('```') + 3
          );
          if (codeFence.split('').every(c => c === '`')) {
            return line;
          }
          codeFence = '';
        }
        if (!codeFence && trimmedLine.startsWith('~~~')) {
          codeFence = trimmedLine.substring(
            0,
            trimmedLine.lastIndexOf('~~~') + 3
          );
          if (codeFence.split('').every(c => c === '~')) {
            return line;
          }
          codeFence = '';
        }
        if (
          !!codeFence &&
          trimmedLine.startsWith(codeFence) &&
          trimmedLine.lastIndexOf(codeFence) === 0
        ) {
          codeFence = '';
        }
        if (codeFence) {
          return line;
        }

        trimmedLine = trimmedLine.trimEnd();
        if (!trimmedLine.startsWith('<') && !trimmedLine.endsWith('>')) {
          // check if it is a url link and wrap it with the angle brackets
          // sometimes the url includes emphasis `_` that will break URL parsing
          //
          // eg. /MuawcBMT1Mzvoar09-_66?mode=page&blockIds=rL2_GXbtLU2SsJVfCSmh_
          // https://www.markdownguide.org/basic-syntax/#urls-and-email-addresses
          try {
            const valid =
              URL.canParse?.(trimmedLine) ?? Boolean(new URL(trimmedLine));
            if (valid) {
              return `<${trimmedLine}>`;
            }
          } catch (err) {
            console.log(err);
          }
        }

        return line.replace(/^ /, '&#x20;');
      })
      .join('\n');
    const markdownAst = this._markdownToAst(payload.file);
    const blockSnapshotRoot = {
      type: 'block',
      id: nanoid(),
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: DEFAULT_NOTE_BACKGROUND_COLOR,
        index: 'a0',
        hidden: false,
        displayMode: NoteDisplayMode.DocAndEdgeless,
      },
      children: [],
    } as BlockSnapshot;
    const contentSlice = (await this._traverseMarkdown(
      markdownAst,
      blockSnapshotRoot,
      payload.assets
    )) as BlockSnapshot;
    if (contentSlice.children.length === 0) {
      return null;
    }
    return {
      type: 'slice',
      content: [contentSlice],
      pageVersion: payload.pageVersion,
      workspaceVersion: payload.workspaceVersion,
      workspaceId: payload.workspaceId,
      pageId: payload.pageId,
    };
  }
}

export const MarkdownAdapterFactoryIdentifier =
  AdapterFactoryIdentifier('Markdown');

export const MarkdownAdapterFactoryExtension: ExtensionType = {
  setup: di => {
    di.addImpl(MarkdownAdapterFactoryIdentifier, provider => ({
      get: (job: Job) =>
        new MarkdownAdapter(
          job,
          Array.from(
            provider.getAll(BlockMarkdownAdapterMatcherIdentifier).values()
          )
        ),
    }));
  },
};
