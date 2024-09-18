import type { AffineTextAttributes } from '@blocksuite/affine-components/rich-text';
import type { DeltaInsert } from '@blocksuite/inline';

import { DEFAULT_NOTE_BACKGROUND_COLOR } from '@blocksuite/affine-model';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import {
  type AssetsManager,
  BaseAdapter,
  type BlockSnapshot,
  type DocSnapshot,
  type FromBlockSnapshotResult,
  type FromDocSnapshotResult,
  type FromSliceSnapshotResult,
  nanoid,
  type SliceSnapshot,
} from '@blocksuite/store';

type NotionEditingStyle = {
  0: string;
};

type NotionEditing = {
  0: string;
  1: Array<NotionEditingStyle>;
};

export type NotionTextSerialized = {
  blockType: string;
  editing: Array<NotionEditing>;
};

export type NotionText = string;

type NotionHtmlToSliceSnapshotPayload = {
  file: NotionText;
  assets?: AssetsManager;
  pageVersion: number;
  workspaceVersion: number;
  workspaceId: string;
  pageId: string;
};

export class NotionTextAdapter extends BaseAdapter<NotionText> {
  override fromBlockSnapshot():
    | FromBlockSnapshotResult<NotionText>
    | Promise<FromBlockSnapshotResult<NotionText>> {
    throw new BlockSuiteError(
      ErrorCode.TransformerNotImplementedError,
      'NotionTextAdapter.fromBlockSnapshot is not implemented.'
    );
  }

  override fromDocSnapshot():
    | FromDocSnapshotResult<NotionText>
    | Promise<FromDocSnapshotResult<NotionText>> {
    throw new BlockSuiteError(
      ErrorCode.TransformerNotImplementedError,
      'NotionTextAdapter.fromDocSnapshot is not implemented.'
    );
  }

  override fromSliceSnapshot():
    | FromSliceSnapshotResult<NotionText>
    | Promise<FromSliceSnapshotResult<NotionText>> {
    return {
      file: JSON.stringify({
        blockType: 'text',
        editing: [
          ['Notion Text is not supported to be exported from BlockSuite', []],
        ],
      }),
      assetsIds: [],
    };
  }

  override toBlockSnapshot(): Promise<BlockSnapshot> | BlockSnapshot {
    throw new BlockSuiteError(
      ErrorCode.TransformerNotImplementedError,
      'NotionTextAdapter.toBlockSnapshot is not implemented.'
    );
  }

  override toDocSnapshot(): Promise<DocSnapshot> | DocSnapshot {
    throw new BlockSuiteError(
      ErrorCode.TransformerNotImplementedError,
      'NotionTextAdapter.toDocSnapshot is not implemented.'
    );
  }

  override toSliceSnapshot(
    payload: NotionHtmlToSliceSnapshotPayload
  ): SliceSnapshot | null {
    const notionText = JSON.parse(payload.file) as NotionTextSerialized;
    const content: SliceSnapshot['content'] = [];
    const deltas: DeltaInsert<AffineTextAttributes>[] = [];
    for (const editing of notionText.editing) {
      const delta: DeltaInsert<AffineTextAttributes> = {
        insert: editing[0],
        attributes: Object.create(null),
      };
      for (const styleElement of editing[1]) {
        switch (styleElement[0]) {
          case 'b':
            delta.attributes!.bold = true;
            break;
          case 'i':
            delta.attributes!.italic = true;
            break;
          case '_':
            delta.attributes!.underline = true;
            break;
          case 'c':
            delta.attributes!.code = true;
            break;
          case 's':
            delta.attributes!.strike = true;
            break;
        }
      }
      deltas.push(delta);
    }

    content.push({
      type: 'block',
      id: nanoid(),
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: DEFAULT_NOTE_BACKGROUND_COLOR,
        index: 'a0',
        hidden: false,
        displayMode: 'both',
      },
      children: [
        {
          type: 'block',
          id: nanoid(),
          flavour: 'affine:paragraph',
          props: {
            type: 'text',
            text: {
              '$blocksuite:internal:text$': true,
              delta: deltas,
            },
          },
          children: [],
        },
      ],
    });

    return {
      type: 'slice',
      content,
      pageVersion: payload.pageVersion,
      workspaceVersion: payload.workspaceVersion,
      workspaceId: payload.workspaceId,
      pageId: payload.pageId,
    };
  }
}
