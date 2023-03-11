import type { DragIndicator } from '@blocksuite/blocks';
import {
  getAllowSelectedBlocks,
  getBlockEditingStateByCursor,
  getBlockEditingStateByPosition,
} from '@blocksuite/blocks';
import type { EditorContainer } from '@blocksuite/editor';
import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';

interface OutsideDragHandler {
  filter: (files: FileList) => boolean;
  handler: () => void;
}

export class OutsideDragManager {
  private _indicator!: DragIndicator;
  private _disposables = new DisposableGroup();
  private _cursor = 0;
  private _getAllowedBlocks: () => BaseBlockModel[] = () => [];
  private _handlers: Array<OutsideDragHandler> = [];

  constructor(editor: EditorContainer) {
    setTimeout(() => {
      this._indicator = <DragIndicator>(
        document.querySelector('affine-drag-indicator')
      );
    });

    this._disposables.addFromEvent(editor, 'mousedown', event => {
      const x = event.clientX;
      const y = event.clientY;

      if (editor.mode === 'page') {
        const defaultPageBlock = editor.querySelector('affine-default-page');
        assertExists(defaultPageBlock);
        this._getAllowedBlocks = () =>
          getAllowSelectedBlocks(defaultPageBlock.model);
      } else {
        const edgelessPageBlock = editor.querySelector('affine-edgeless-page');
        assertExists(edgelessPageBlock);
        this._getAllowedBlocks = () =>
          getAllowSelectedBlocks(edgelessPageBlock.pageModel);
      }

      const blocks = this._getAllowedBlocks();
      const modelState = getBlockEditingStateByPosition(blocks, x, y, {
        skipX: true,
      });
      modelState
        ? (this._cursor = modelState.index)
        : (this._cursor = blocks.length - 1);
    });

    this._disposables.addFromEvent(editor, 'dragover', event => {
      event.preventDefault();
      const x = event.clientX;
      const y = event.clientY;
      const modelState = this._cursor
        ? getBlockEditingStateByCursor(
            this._getAllowedBlocks(),
            x,
            y,
            this._cursor,
            {
              size: 5,
              skipX: false,
              dragging: true,
            }
          )
        : getBlockEditingStateByPosition(this._getAllowedBlocks(), x, y, {
            skipX: true,
          });
      if (modelState) {
        this._cursor = modelState.index;
        this._indicator.targetRect = modelState.position;
      }
      this._indicator.cursorPosition = { x, y };
    });

    this._disposables.addFromEvent(editor, 'drop', event => {
      const files = event.dataTransfer?.files;
      if (files?.length) {
        for (const h of this._handlers) {
          const { filter, handler } = h;
          if (filter(files)) {
            event.preventDefault();
            handler();
          }
        }
      }
      this._indicator.cursorPosition = null;
      this._indicator.targetRect = null;
    });
  }

  registerHandler(filter: (files: FileList) => boolean, handler: () => void) {
    this._handlers.push({ filter, handler });
  }
}
