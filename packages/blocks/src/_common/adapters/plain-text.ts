import type { DeltaInsert } from '@blocksuite/inline';
import type { AssetsManager } from '@blocksuite/store';

import {
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
  type SliceSnapshot,
  type ToBlockSnapshotPayload,
  type ToDocSnapshotPayload,
  nanoid,
} from '@blocksuite/store';

import { NoteDisplayMode } from '../types.js';

export type PlainText = string;

type PlainTextToSliceSnapshotPayload = {
  assets?: AssetsManager;
  blockVersions: Record<string, number>;
  file: PlainText;
  pageId: string;
  pageVersion: number;
  workspaceId: string;
  workspaceVersion: number;
};

export class PlainTextAdapter extends BaseAdapter<PlainText> {
  private async _traverseSnapshot(
    snapshot: BlockSnapshot
  ): Promise<{ plaintext: string }> {
    let buffer = '';
    const walker = new ASTWalker<BlockSnapshot, never>();
    walker.setONodeTypeGuard(
      (node): node is BlockSnapshot =>
        BlockSnapshotSchema.safeParse(node).success
    );
    walker.setEnter(o => {
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

  async fromBlockSnapshot({
    snapshot,
  }: FromBlockSnapshotPayload): Promise<FromBlockSnapshotResult<PlainText>> {
    const { plaintext } = await this._traverseSnapshot(snapshot);
    return {
      assetsIds: [],
      file: plaintext,
    };
  }

  async fromDocSnapshot({
    assets,
    snapshot,
  }: FromDocSnapshotPayload): Promise<FromDocSnapshotResult<PlainText>> {
    let buffer = '';
    if (snapshot.meta.title) {
      buffer += `${snapshot.meta.title}\n\n`;
    }
    const { assetsIds, file } = await this.fromBlockSnapshot({
      assets,
      snapshot: snapshot.blocks,
    });
    buffer += file;
    return {
      assetsIds,
      file: buffer,
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
      assetsIds: sliceAssetsIds,
      file: plaintext,
    };
  }

  toBlockSnapshot(payload: ToBlockSnapshotPayload<PlainText>): BlockSnapshot {
    payload.file = payload.file.replaceAll('\r', '');
    return {
      children: payload.file.split('\n').map((line): BlockSnapshot => {
        return {
          children: [],
          flavour: 'affine:paragraph',
          id: nanoid(),
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: line,
                },
              ],
            },
            type: 'text',
          },
          type: 'block',
        };
      }),
      flavour: 'affine:note',
      id: nanoid(),
      props: {
        background: '--affine-background-secondary-color',
        displayMode: NoteDisplayMode.DocAndEdgeless,
        hidden: false,
        index: 'a0',
        xywh: '[0,0,800,95]',
      },
      type: 'block',
    };
  }

  toDocSnapshot(payload: ToDocSnapshotPayload<PlainText>): DocSnapshot {
    payload.file = payload.file.replaceAll('\r', '');
    return {
      blocks: {
        children: [
          {
            children: [],
            flavour: 'affine:surface',
            id: nanoid(),
            props: {
              elements: {},
            },
            type: 'block',
          },
          {
            children: payload.file.split('\n').map((line): BlockSnapshot => {
              return {
                children: [],
                flavour: 'affine:paragraph',
                id: nanoid(),
                props: {
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        insert: line,
                      },
                    ],
                  },
                  type: 'text',
                },
                type: 'block',
              };
            }),
            flavour: 'affine:note',
            id: nanoid(),
            props: {
              background: '--affine-background-secondary-color',
              displayMode: NoteDisplayMode.DocAndEdgeless,
              hidden: false,
              index: 'a0',
              xywh: '[0,0,800,95]',
            },
            type: 'block',
          },
        ],
        flavour: 'affine:page',
        id: nanoid(),
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
        type: 'block',
      },
      meta: {
        createDate: Date.now(),
        id: nanoid(),
        tags: [],
        title: 'Untitled',
      },
      type: 'page',
    };
  }

  toSliceSnapshot(
    payload: PlainTextToSliceSnapshotPayload
  ): SliceSnapshot | null {
    if (payload.file.trim().length === 0) {
      return null;
    }
    payload.file = payload.file.replaceAll('\r', '');
    const contentSlice = {
      children: payload.file.split('\n').map((line): BlockSnapshot => {
        return {
          children: [],
          flavour: 'affine:paragraph',
          id: nanoid(),
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: line,
                },
              ],
            },
            type: 'text',
          },
          type: 'block',
        };
      }),
      flavour: 'affine:note',
      id: nanoid(),
      props: {
        background: '--affine-background-secondary-color',
        displayMode: NoteDisplayMode.DocAndEdgeless,
        hidden: false,
        index: 'a0',
        xywh: '[0,0,800,95]',
      },
      type: 'block',
    } as BlockSnapshot;
    return {
      content: [contentSlice],
      pageId: payload.pageId,
      pageVersion: payload.pageVersion,
      type: 'slice',
      workspaceId: payload.workspaceId,
      workspaceVersion: payload.workspaceVersion,
    };
  }
}
