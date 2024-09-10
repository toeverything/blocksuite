import type { DeltaInsert } from '@blocksuite/inline';

import {
  DEFAULT_NOTE_BACKGROUND_COLOR,
  NoteDisplayMode,
} from '@blocksuite/affine-model';
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
  nanoid,
  type SliceSnapshot,
  type ToBlockSnapshotPayload,
  type ToDocSnapshotPayload,
} from '@blocksuite/store';

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
      file: plaintext,
      assetsIds: [],
    };
  }

  async fromDocSnapshot({
    snapshot,
    assets,
  }: FromDocSnapshotPayload): Promise<FromDocSnapshotResult<PlainText>> {
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

  toBlockSnapshot(payload: ToBlockSnapshotPayload<PlainText>): BlockSnapshot {
    payload.file = payload.file.replaceAll('\r', '');
    return {
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
      children: payload.file.split('\n').map((line): BlockSnapshot => {
        return {
          type: 'block',
          id: nanoid(),
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

  toDocSnapshot(payload: ToDocSnapshotPayload<PlainText>): DocSnapshot {
    payload.file = payload.file.replaceAll('\r', '');
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
          {
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
            children: payload.file.split('\n').map((line): BlockSnapshot => {
              return {
                type: 'block',
                id: nanoid(),
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

  toSliceSnapshot(
    payload: PlainTextToSliceSnapshotPayload
  ): SliceSnapshot | null {
    if (payload.file.trim().length === 0) {
      return null;
    }
    payload.file = payload.file.replaceAll('\r', '');
    const contentSlice = {
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
      children: payload.file.split('\n').map((line): BlockSnapshot => {
        return {
          type: 'block',
          id: nanoid(),
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
    } as BlockSnapshot;
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
