import type {
  BlockComponent,
  EditorHost,
  ExtensionType,
  PointerEventState,
} from '@blocksuite/block-std';
import type { Point } from '@blocksuite/global/utils';

import { createIdentifier } from '@blocksuite/global/di';

export type DropType = 'before' | 'after' | 'in';
export type OnDragStartProps = {
  state: PointerEventState;
  startDragging: (
    blocks: BlockComponent[],
    state: PointerEventState,
    dragPreview?: HTMLElement,
    dragPreviewOffset?: Point
  ) => void;
  anchorBlockId: string | null;
  editorHost: EditorHost;
};

export type OnDragEndProps = {
  state: PointerEventState;
  draggingElements: BlockComponent[];
  dropBlockId: string;
  dropType: DropType | null;
  dragPreview: HTMLElement;
  noteScale: number;
  editorHost: EditorHost;
};

export type OnDragMoveProps = {
  state: PointerEventState;
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
