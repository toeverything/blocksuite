import type { ExtensionType } from '@blocksuite/block-std';

import {
  DEFAULT_NOTE_BACKGROUND_COLOR,
  NoteDisplayMode,
} from '@blocksuite/affine-model';
import {
  type AdapterContext,
  type BlockNotionHtmlAdapterMatcher,
  BlockNotionHtmlAdapterMatcherIdentifier,
  HastUtils,
  type HtmlAST,
  type NotionHtml,
  NotionHtmlDeltaConverter,
} from '@blocksuite/affine-shared/adapters';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import {
  type AssetsManager,
  ASTWalker,
  BaseAdapter,
  type BlockSnapshot,
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
} from '@blocksuite/store';
import rehypeParse from 'rehype-parse';
import { unified } from 'unified';

import { AdapterFactoryIdentifier } from '../type.js';
import { defaultBlockNotionHtmlAdapterMatchers } from './block-matcher.js';
import { notionHtmlInlineToDeltaMatchers } from './delta-converter/html-inline.js';

type NotionHtmlToSliceSnapshotPayload = {
  file: NotionHtml;
  assets?: AssetsManager;
  blockVersions: Record<string, number>;
  pageVersion: number;
  workspaceVersion: number;
  workspaceId: string;
  pageId: string;
};

type NotionHtmlToDocSnapshotPayload = {
  file: NotionHtml;
  assets?: AssetsManager;
  pageId?: string;
  pageMap?: Map<string, string>;
};

type NotionHtmlToBlockSnapshotPayload = NotionHtmlToDocSnapshotPayload;

export class NotionHtmlAdapter extends BaseAdapter<NotionHtml> {
  private _traverseNotionHtml = async (
    html: HtmlAST,
    snapshot: BlockSnapshot,
    assets?: AssetsManager,
    pageMap?: Map<string, string>
  ) => {
    const walker = new ASTWalker<HtmlAST, BlockSnapshot>();
    walker.setONodeTypeGuard(
      (node): node is HtmlAST =>
        'type' in (node as object) && (node as HtmlAST).type !== undefined
    );
    walker.setEnter(async (o, context) => {
      for (const matcher of this.blockMatchers) {
        if (matcher.toMatch(o)) {
          const adapterContext: AdapterContext<
            HtmlAST,
            BlockSnapshot,
            NotionHtmlDeltaConverter
          > = {
            walker,
            walkerContext: context,
            configs: this.configs,
            job: this.job,
            deltaConverter: this.deltaConverter,
            textBuffer: { content: '' },
            assets,
            pageMap,
          };
          await matcher.toBlockSnapshot.enter?.(o, adapterContext);
        }
      }
    });
    walker.setLeave(async (o, context) => {
      for (const matcher of this.blockMatchers) {
        if (matcher.toMatch(o)) {
          const adapterContext: AdapterContext<
            HtmlAST,
            BlockSnapshot,
            NotionHtmlDeltaConverter
          > = {
            walker,
            walkerContext: context,
            configs: this.configs,
            job: this.job,
            deltaConverter: this.deltaConverter,
            textBuffer: { content: '' },
            assets,
            pageMap,
          };
          await matcher.toBlockSnapshot.leave?.(o, adapterContext);
        }
      }
    });
    return walker.walk(html, snapshot);
  };

  deltaConverter: NotionHtmlDeltaConverter;

  constructor(
    job: Job,
    readonly blockMatchers: BlockNotionHtmlAdapterMatcher[] = defaultBlockNotionHtmlAdapterMatchers
  ) {
    super(job);
    this.deltaConverter = new NotionHtmlDeltaConverter(
      job.adapterConfigs,
      [],
      notionHtmlInlineToDeltaMatchers
    );
  }

  private _htmlToAst(notionHtml: NotionHtml) {
    return unified().use(rehypeParse).parse(notionHtml);
  }

  override fromBlockSnapshot(
    _payload: FromBlockSnapshotPayload
  ): Promise<FromBlockSnapshotResult<NotionHtml>> {
    throw new BlockSuiteError(
      ErrorCode.TransformerNotImplementedError,
      'NotionHtmlAdapter.fromBlockSnapshot is not implemented'
    );
  }

  override fromDocSnapshot(
    _payload: FromDocSnapshotPayload
  ): Promise<FromDocSnapshotResult<NotionHtml>> {
    throw new BlockSuiteError(
      ErrorCode.TransformerNotImplementedError,
      'NotionHtmlAdapter.fromDocSnapshot is not implemented'
    );
  }

  override fromSliceSnapshot(
    _payload: FromSliceSnapshotPayload
  ): Promise<FromSliceSnapshotResult<NotionHtml>> {
    throw new BlockSuiteError(
      ErrorCode.TransformerNotImplementedError,
      'NotionHtmlAdapter.fromSliceSnapshot is not implemented'
    );
  }

  override toBlockSnapshot(
    payload: NotionHtmlToBlockSnapshotPayload
  ): Promise<BlockSnapshot> {
    const notionHtmlAst = this._htmlToAst(payload.file);
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
    return this._traverseNotionHtml(
      notionHtmlAst,
      blockSnapshotRoot as BlockSnapshot,
      payload.assets,
      payload.pageMap
    );
  }

  override async toDoc(payload: NotionHtmlToDocSnapshotPayload) {
    const snapshot = await this.toDocSnapshot(payload);
    return this.job.snapshotToDoc(snapshot);
  }

  override async toDocSnapshot(
    payload: NotionHtmlToDocSnapshotPayload
  ): Promise<DocSnapshot> {
    const notionHtmlAst = this._htmlToAst(payload.file);
    const titleAst = HastUtils.querySelector(notionHtmlAst, 'title');
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
        id: payload.pageId ?? nanoid(),
        title: HastUtils.getTextContent(titleAst, ''),
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
            delta: this.deltaConverter.astToDelta(
              titleAst ?? {
                type: 'text',
                value: '',
              }
            ),
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
          await this._traverseNotionHtml(
            notionHtmlAst,
            blockSnapshotRoot as BlockSnapshot,
            payload.assets,
            payload.pageMap
          ),
        ],
      },
    };
  }

  override async toSliceSnapshot(
    payload: NotionHtmlToSliceSnapshotPayload
  ): Promise<SliceSnapshot | null> {
    const notionHtmlAst = this._htmlToAst(payload.file);
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
    const contentSlice = (await this._traverseNotionHtml(
      notionHtmlAst,
      blockSnapshotRoot as BlockSnapshot,
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

export const NotionHtmlAdapterFactoryIdentifier =
  AdapterFactoryIdentifier('NotionHtml');

export const NotionHtmlAdapterFactoryExtension: ExtensionType = {
  setup: di => {
    di.addImpl(NotionHtmlAdapterFactoryIdentifier, provider => ({
      get: (job: Job) =>
        new NotionHtmlAdapter(
          job,
          Array.from(
            provider.getAll(BlockNotionHtmlAdapterMatcherIdentifier).values()
          )
        ),
    }));
  },
};
