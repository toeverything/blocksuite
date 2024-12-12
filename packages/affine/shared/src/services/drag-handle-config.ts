import type { Point } from '@blocksuite/global/utils';

import {
  type BlockComponent,
  type BlockStdScope,
  type DndEventState,
  type EditorHost,
  Extension,
  type ExtensionType,
  StdIdentifier,
} from '@blocksuite/block-std';
import { type Container, createIdentifier } from '@blocksuite/global/di';
import {
  type BlockModel,
  Job,
  Slice,
  type SliceSnapshot,
} from '@blocksuite/store';

export type DropType = 'before' | 'after' | 'in';
export type OnDragStartProps = {
  state: DndEventState;
  startDragging: (
    blocks: BlockComponent[],
    state: DndEventState,
    dragPreview?: HTMLElement,
    dragPreviewOffset?: Point
  ) => void;
  anchorBlockId: string | null;
  editorHost: EditorHost;
};

export type OnDragEndProps = {
  state: DndEventState;
  draggingElements: BlockComponent[];
  dropBlockId: string;
  dropType: DropType | null;
  dragPreview: HTMLElement;
  noteScale: number;
  editorHost: EditorHost;
};

export type OnDragMoveProps = {
  state: DndEventState;
  draggingElements?: BlockComponent[];
};

export type DragHandleOption = {
  flavour: string | RegExp;
  edgeless?: boolean;
  onDragStart?: (props: OnDragStartProps) => boolean;
  onDragMove?: (props: OnDragMoveProps) => boolean;
  onDragEnd?: (props: OnDragEndProps) => boolean;
};

export const DragHandleConfigIdentifier = createIdentifier<DragHandleOption>(
  'AffineDragHandleIdentifier'
);

export function DragHandleConfigExtension(
  option: DragHandleOption
): ExtensionType {
  return {
    setup: di => {
      const key =
        typeof option.flavour === 'string'
          ? option.flavour
          : option.flavour.source;
      di.addImpl(DragHandleConfigIdentifier(key), () => option);
    },
  };
}

export const DndApiExtensionIdentifier = createIdentifier<DNDAPIExtension>(
  'AffineDndApiIdentifier'
);

export class DNDAPIExtension extends Extension {
  mimeType = 'application/x-blocksuite-dnd';

  constructor(readonly std: BlockStdScope) {
    super();
  }

  static override setup(di: Container) {
    di.add(this, [StdIdentifier]);

    di.addImpl(DndApiExtensionIdentifier, provider => provider.get(this));
  }

  decodeSnapshot(dataTransfer: DataTransfer): SliceSnapshot {
    const data = dataTransfer.getData(this.mimeType);

    return JSON.parse(decodeURIComponent(data));
  }

  encodeSnapshot(json: SliceSnapshot, dataTransfer: DataTransfer) {
    const snapshot = JSON.stringify(json);
    dataTransfer.setData(this.mimeType, encodeURIComponent(snapshot));
  }

  fromEntity(docId: string, blockId?: string): SliceSnapshot | null {
    const doc = this.std.collection.getDoc(docId);
    if (!doc) {
      console.error(`Doc ${docId} not found`);
      return null;
    }
    const blocks: BlockModel[] = [];
    if (blockId) {
      const model = doc.getBlock(blockId)?.model;
      if (model) {
        blocks.push(model);
      }
    }
    const slice = Slice.fromModels(doc, blocks);
    const job = new Job({ collection: this.std.collection });
    const snapshot = job.sliceToSnapshot(slice);
    if (!snapshot) {
      console.error('Failed to convert slice to snapshot');
      return null;
    }
    return snapshot;
  }
}
