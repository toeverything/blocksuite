import type {
  BlockComponent,
  DndEventState,
  EditorHost,
  ExtensionType,
} from '@blocksuite/block-std';
import type { Point } from '@blocksuite/global/utils';

import { createIdentifier } from '@blocksuite/global/di';

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

export type DndApi = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  decodeSnapshot: (dataTransfer: DataTransfer) => any | null;
  encodeSnapshot: (
    json: Record<string, unknown>,
    dataTransfer: DataTransfer,
    html?: string
  ) => void;
};

export const DndApiExtensionIdentifier = createIdentifier<DndApi>(
  'AffineDndApiIdentifier'
);

export function DNDAPIExtension(): ExtensionType {
  return {
    setup: di => {
      di.addImpl(DndApiExtensionIdentifier, () => ({
        decodeSnapshot: dataTransfer => {
          const html = dataTransfer.getData('text/html');
          if (!html) return null;

          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const dom = doc.querySelector<HTMLDivElement>(
            '[data-blocksuite-snapshot]'
          );
          if (!dom) return null;

          const json = JSON.parse(
            decodeURIComponent(dom.dataset.blocksuiteSnapshot as string)
          );
          return json;
        },
        encodeSnapshot: (json, dataTransfer, htmlBody = '') => {
          const snapshot = JSON.stringify(json);
          dataTransfer.setData(
            'text/html',
            `<div data-blocksuite-snapshot="${encodeURIComponent(snapshot)}">${htmlBody}</div>`
          );
        },
      }));
    },
  };
}
