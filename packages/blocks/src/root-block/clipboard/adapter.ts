import type { CellBlockModel } from '@blocksuite/affine-model';
import type {
  BlockSnapshot,
  DocSnapshot,
  DocSnapshot,
  FromBlockSnapshotPayload,
  FromBlockSnapshotResult,
  FromDocSnapshotPayload,
  FromDocSnapshotResult,
  FromSliceSnapshotPayload,
  FromSliceSnapshotResult,
  SliceSnapshot,
  ToBlockSnapshotPayload,
  ToDocSnapshotPayload,
  ToSliceSnapshotPayload,
} from '@blocksuite/store';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { assertExists } from '@blocksuite/global/utils';
import { BaseAdapter } from '@blocksuite/store';
import { nanoid } from 'nanoid';

import { decodeClipboardBlobs, encodeClipboardBlobs } from './utils.js';

export type FileSnapshot = {
  name: string;
  type: string;
  content: string;
};

export class ClipboardAdapter extends BaseAdapter<string> {
  static MIME = 'BLOCKSUITE/SNAPSHOT';

  override fromBlockSnapshot(
    _payload: FromBlockSnapshotPayload
  ): Promise<FromBlockSnapshotResult<string>> {
    throw new BlockSuiteError(
      ErrorCode.TransformerNotImplementedError,
      'ClipboardAdapter.fromBlockSnapshot is not implemented'
    );
  }

  override fromDocSnapshot(
    _payload: FromDocSnapshotPayload
  ): Promise<FromDocSnapshotResult<string>> {
    throw new BlockSuiteError(
      ErrorCode.TransformerNotImplementedError,
      'ClipboardAdapter.fromDocSnapshot is not implemented'
    );
  }

  override async fromSliceSnapshot(
    payload: FromSliceSnapshotPayload
  ): Promise<FromSliceSnapshotResult<string>> {
    const snapshot = payload.snapshot;
    const assets = payload.assets;
    assertExists(assets);
    const map = assets.getAssets();
    const blobs: Record<string, FileSnapshot> = await encodeClipboardBlobs(map);
    return {
      file: JSON.stringify({
        snapshot,
        blobs,
      }),
      assetsIds: [],
    };
  }

  override toBlockSnapshot(
    _payload: ToBlockSnapshotPayload<string>
  ): Promise<BlockSnapshot> {
    throw new BlockSuiteError(
      ErrorCode.TransformerNotImplementedError,
      'ClipboardAdapter.toBlockSnapshot is not implemented'
    );
  }

  override toDocSnapshot(
    _payload: ToDocSnapshotPayload<string>
  ): Promise<DocSnapshot> {
    throw new BlockSuiteError(
      ErrorCode.TransformerNotImplementedError,
      'ClipboardAdapter.toDocSnapshot is not implemented'
    );
  }

  override toSliceSnapshot(
    payload: ToSliceSnapshotPayload<string>
  ): Promise<SliceSnapshot> {
    const json = JSON.parse(payload.file);
    const { blobs, snapshot } = json;
    const map = payload.assets?.getAssets();
    decodeClipboardBlobs(blobs, map);
    return Promise.resolve(snapshot);
  }
}

export class MicrosheetAdapter extends BaseAdapter<string> {
  static MIME = 'blocksuite/microsheet';

  override fromBlockSnapshot():
    | Promise<FromBlockSnapshotResult<string>>
    | FromBlockSnapshotResult<string> {
    throw new Error('Method not implemented.');
  }

  override fromDocSnapshot():
    | Promise<FromDocSnapshotResult<string>>
    | FromDocSnapshotResult<string> {
    throw new Error('Method not implemented.');
  }

  override fromSliceSnapshot(
    payload: FromSliceSnapshotPayload
  ):
    | Promise<FromSliceSnapshotResult<string>>
    | FromSliceSnapshotResult<string> {
    return payload;
  }

  override toBlockSnapshot(): Promise<BlockSnapshot> | BlockSnapshot {
    throw new Error('Method not implemented.');
  }

  override toDocSnapshot(): Promise<DocSnapshot> | DocSnapshot {
    throw new Error('Method not implemented.');
  }

  override toSliceSnapshot(
    payload: ToSliceSnapshotPayload<string>
  ): Promise<SliceSnapshot | null> | SliceSnapshot | null {
    let copiedCells = [];
    try {
      copiedCells = JSON.parse(payload.file);
    } catch (err) {
      console.error(err);
    }
    if (copiedCells.length === 0) return null;
    const microsheetSnapshotContent = new MicrosheetSnapshotContent(
      copiedCells
    );
    const snapshot: SliceSnapshot = {
      type: 'slice',
      pageVersion: payload.pageVersion,
      workspaceVersion: payload.workspaceVersion,
      workspaceId: payload.workspaceId,
      pageId: payload.pageId,
      content: [microsheetSnapshotContent.toSnapshotContent()],
    };

    return snapshot;
  }
}

interface CopiedCellItem {
  cellContainerSlice: string;
}

interface PropCellItem {
  columnId: string;
  value: string;
  ref: string;
}

type PropCells = Record<string, Record<string, PropCellItem>>;

interface PropColumnItem {
  type: 'title' | 'rich-text';
  name: 'Title' | 'content';
  data: {};
  id: string;
}

class MicrosheetSnapshotContent {
  cells: PropCells = {};

  colCount: number;

  columns: PropColumnItem[] = [];

  copiedCells: CopiedCellItem[][];

  rowCount: number;

  rows: RowSnapshot[] = [];

  titleColumnsId: string;

  constructor(copiedCells: CopiedCellItem[][]) {
    this.copiedCells = copiedCells;
    this.titleColumnsId = nanoid();
    this.rowCount = copiedCells.length;
    this.colCount = copiedCells[0]?.length || 0;

    this.init();
  }

  private addColumn(props: Partial<PropColumnItem> = {}) {
    const newColumn: PropColumnItem = {
      type: 'rich-text',
      name: 'Title',
      data: {},
      id: nanoid(),
      ...props,
    };
    this.columns.push(newColumn);
    return newColumn.id;
  }

  private addRow() {
    const row = new RowSnapshot(this);
    this.rows.push(row);
    return row;
  }

  private getCellContent(i: number, j: number) {
    const item = this.copiedCells[i][j];
    try {
      const snapshot = JSON.parse(item.cellContainerSlice)
        ?.snapshot as SliceSnapshot;
      return snapshot.content;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  private getProps() {
    return {
      views: [
        {
          id: nanoid(),
          name: 'Table View',
          mode: 'table',
          columns: [],
          filter: {
            type: 'group',
            op: 'and',
            conditions: [],
          },
          header: {
            titleColumn: this.titleColumnsId,
            iconColumn: 'type',
          },
        },
      ],
      title: {
        '$blocksuite:internal:text$': true,
        delta: [],
      },
      cells: this.cells,
      columns: this.columns,
    };
  }

  private init() {
    this.addColumn({ id: this.titleColumnsId, type: 'title' });

    const contentColumnIds = [];
    for (let i = 0; i < this.colCount; i++) {
      contentColumnIds.push(this.addColumn());
    }

    for (let i = 0; i < this.rowCount; i++) {
      const row = this.addRow();
      for (let j = 0; j < this.colCount; j++) {
        const cell = row.addCell(contentColumnIds[j]);
        cell.addChildren(this.getCellContent(i, j));
      }
    }
  }

  toSnapshotContent() {
    return {
      type: 'block',
      id: nanoid(),
      flavour: 'affine:microsheet',
      version: 3,
      props: this.getProps(),
      children: this.rows.map(row => row.toSnapshotContent()),
    } as SliceSnapshot['content'][number];
  }
}

class RowSnapshot {
  cells: CellSnapshot[] = [];

  ctx: MicrosheetSnapshotContent;

  id: string;

  constructor(ctx: MicrosheetSnapshotContent) {
    this.ctx = ctx;
    this.id = nanoid();
  }

  addCell(columnId: string) {
    const cell = new CellSnapshot();
    this.cells.push(cell);

    if (!this.ctx.cells[this.id]) {
      this.ctx.cells[this.id] = {};
    }
    this.ctx.cells[this.id][columnId] = {
      columnId,
      value: '',
      ref: cell.id,
    };
    return cell;
  }

  toSnapshotContent() {
    return {
      type: 'block',
      id: this.id,
      flavour: 'affine:row',
      version: 1,
      props: {},
      children: this.cells.map(cell => cell.toSnapshotContent()),
    };
  }
}

class CellSnapshot {
  children: CellBlockModel[] = [];

  id: string;

  constructor() {
    this.id = nanoid();
  }

  addChildren(items: CellBlockModel[]) {
    this.children.push(...items);
  }

  toSnapshotContent() {
    return {
      type: 'block',
      id: this.id,
      flavour: 'affine:cell',
      version: 1,
      props: {},
      children: this.children,
    };
  }
}
