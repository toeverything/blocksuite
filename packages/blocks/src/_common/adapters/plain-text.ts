import type { DeltaInsert } from '@blocksuite/inline';
import type { AssetsManager } from '@blocksuite/store';
import {
  ASTWalker,
  BaseAdapter,
  type BlockSnapshot,
  BlockSnapshotSchema,
  type FromBlockSnapshotPayload,
  type FromBlockSnapshotResult,
  type FromPageSnapshotPayload,
  type FromPageSnapshotResult,
  type FromSliceSnapshotPayload,
  type FromSliceSnapshotResult,
  nanoid,
  type PageSnapshot,
  type SliceSnapshot,
  type ToBlockSnapshotPayload,
  type ToPageSnapshotPayload,
} from '@blocksuite/store';

import { MarkdownAdapter } from './markdown.js';

export type PlainText = string;

type PlainTextToSliceSnapshotPayload = {
  file: PlainText;
  assets?: AssetsManager;
  blockVersions: Record<string, number>;
  pageVersion: number;
  workspaceVersion: number;
  workspaceId: string;
  pageId: string;
};

export class PlainTextAdapter extends BaseAdapter<PlainText> {
  private _markdownAdapter: MarkdownAdapter;
  constructor() {
    super();
    this._markdownAdapter = new MarkdownAdapter();
  }
  async fromPageSnapshot({
    snapshot,
    assets,
  }: FromPageSnapshotPayload): Promise<FromPageSnapshotResult<PlainText>> {
    let buffer = '';
    if (snapshot.meta.title) {
      buffer += `${snapshot.meta.title}\n\n`;
    }
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

  async fromBlockSnapshot({
    snapshot,
  }: FromBlockSnapshotPayload): Promise<FromBlockSnapshotResult<PlainText>> {
    const { plaintext } = await this._traverseSnapshot(snapshot);
    return {
      file: plaintext,
      assetsIds: [],
    };
  }

  async fromSliceSnapshot({
    snapshot,
  }: FromSliceSnapshotPayload): Promise<FromSliceSnapshotResult<PlainText>> {
    let buffer = '';
    const sliceAssetsIds: string[] = [];
    for (const contentSlice of snapshot.content) {
      const { plaintext } = await this._traverseSnapshot(contentSlice);
      buffer += plaintext;
    }
    const plaintext =
      buffer.match(/\n/g)?.length === 1 ? buffer.trimEnd() : buffer;
    return {
      file: plaintext,
      assetsIds: sliceAssetsIds,
    };
  }

  async toPageSnapshot(
    payload: ToPageSnapshotPayload<PlainText>
  ): Promise<PageSnapshot> {
    payload.file = payload.file.replaceAll('\r', '');
    return {
      type: 'page',
      meta: {
        id: nanoid('page'),
        title: 'Untitled',
        createDate: +new Date(),
        tags: [],
      },
      blocks: {
        type: 'block',
        id: nanoid('block'),
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
            id: nanoid('block'),
            flavour: 'affine:surface',
            props: {
              elements: {},
            },
            children: [],
          },
          {
            type: 'block',
            id: nanoid('block'),
            flavour: 'affine:note',
            props: {
              xywh: '[0,0,800,95]',
              background: '--affine-background-secondary-color',
              index: 'a0',
              hidden: false,
            },
            children: payload.file.split('\n').map((line): BlockSnapshot => {
              return {
                type: 'block',
                id: nanoid('block'),
                flavour: 'affine:paragraph',
                props: {
                  type: 'text',
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        insert: line,
                      },
                    ],
                  },
                },
                children: [],
              };
            }),
          },
        ],
      },
    };
  }

  async toBlockSnapshot(
    payload: ToBlockSnapshotPayload<PlainText>
  ): Promise<BlockSnapshot> {
    payload.file = payload.file.replaceAll('\r', '');
    return {
      type: 'block',
      id: nanoid('block'),
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: '--affine-background-secondary-color',
        index: 'a0',
        hidden: false,
      },
      children: payload.file.split('\n').map((line): BlockSnapshot => {
        return {
          type: 'block',
          id: nanoid('block'),
          flavour: 'affine:paragraph',
          props: {
            type: 'text',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: line,
                },
              ],
            },
          },
          children: [],
        };
      }),
    };
  }

  async toSliceSnapshot(
    payload: PlainTextToSliceSnapshotPayload
  ): Promise<SliceSnapshot | null> {
    this._markdownAdapter.applyConfigs(this.configs);
    if (payload.file.trim().length === 0) {
      return null;
    }
    payload.file = payload.file.replaceAll('\r', '');
    const sliceSnapshot = await this._markdownAdapter.toSliceSnapshot({
      file: payload.file,
      assets: payload.assets,
      blockVersions: payload.blockVersions,
      pageVersion: payload.pageVersion,
      workspaceVersion: payload.workspaceVersion,
      workspaceId: payload.workspaceId,
      pageId: payload.pageId,
    });
    return sliceSnapshot;
  }

  private async _traverseSnapshot(
    snapshot: BlockSnapshot
  ): Promise<{ plaintext: string }> {
    let buffer = '';
    const walker = new ASTWalker<BlockSnapshot, never>();
    walker.setONodeTypeGuard(
      (node): node is BlockSnapshot =>
        BlockSnapshotSchema.safeParse(node).success
    );
    walker.setEnter(async o => {
      const text = (o.node.props.text ?? { delta: [] }) as {
        delta: DeltaInsert[];
      };
      switch (o.node.flavour) {
        case 'affine:code': {
          buffer += text.delta.map(delta => delta.insert).join('');
          buffer += '\n';
          break;
        }
        case 'affine:paragraph': {
          buffer += text.delta.map(delta => delta.insert).join('');
          buffer += '\n';
          break;
        }
        case 'affine:list': {
          buffer += text.delta.map(delta => delta.insert).join('');
          buffer += '\n';
          break;
        }
        case 'affine:divider': {
          buffer += '---\n';
          break;
        }
      }
    });
    await walker.walkONode(snapshot);
    return {
      plaintext: buffer,
    };
  }
}
