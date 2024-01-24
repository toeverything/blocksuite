import type { BlockService } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import type { BlockModel } from '@blocksuite/store';

import {
  calcDropTarget,
  type DropResult,
  getClosestBlockElementByPoint,
  getModelByBlockComponent,
  isInsideDocEditor,
  matchFlavours,
  Point,
} from '../../_common/utils/index.js';
import type { DragIndicator } from './drag-indicator.js';

export type onDropProps = {
  files: File[];
  targetModel: BlockModel | null;
  place: 'before' | 'after';
  point: Point;
};

export type FileDropOptions = {
  flavour: string;
  onDrop?: ({
    files,
    targetModel,
    place,
    point,
  }: onDropProps) => Promise<boolean> | void;
};

export class FileDropManager {
  private _blockService: BlockService;
  private _fileDropOptions: FileDropOptions;

  private static _dropResult: DropResult | null = null;
  private _indicator!: DragIndicator;

  constructor(blockService: BlockService, fileDropOptions: FileDropOptions) {
    this._blockService = blockService;
    this._fileDropOptions = fileDropOptions;

    this._indicator = <DragIndicator>(
      document.querySelector('affine-drag-indicator')
    );
    if (!this._indicator) {
      this._indicator = <DragIndicator>(
        document.createElement('affine-drag-indicator')
      );
      document.body.appendChild(this._indicator);
    }

    if (fileDropOptions.onDrop) {
      this._blockService.disposables.addFromEvent(
        this._blockService.std.host,
        'drop',
        this._onDrop
      );
    }
  }

  get editorHost(): EditorHost {
    return this._blockService.std.host as EditorHost;
  }

  get type(): 'before' | 'after' {
    return !FileDropManager._dropResult ||
      FileDropManager._dropResult.type !== 'before'
      ? 'after'
      : 'before';
  }

  get targetModel(): BlockModel | null {
    const pageBlock = this._blockService.page.root;
    assertExists(pageBlock);

    let targetModel = FileDropManager._dropResult?.modelState.model || null;

    if (!targetModel && isInsideDocEditor(this.editorHost)) {
      const lastNote = pageBlock.children[pageBlock.children.length - 1];
      if (!matchFlavours(lastNote, ['affine:note'])) {
        throw new Error('The last block is not a note block.');
      }
      targetModel = lastNote.lastItem();
    }

    return targetModel;
  }

  onDragOver = (event: DragEvent) => {
    event.preventDefault();

    // allow only external drag-and-drop files
    const effectAllowed = event.dataTransfer?.effectAllowed ?? 'none';
    if (effectAllowed !== 'all') return;

    const { clientX, clientY } = event;
    const point = new Point(clientX, clientY);
    const element = getClosestBlockElementByPoint(point.clone());

    let result: DropResult | null = null;
    if (element) {
      const model = getModelByBlockComponent(element);
      result = calcDropTarget(point, model, element);
    }
    if (result) {
      FileDropManager._dropResult = result;
      this._indicator.rect = result.rect;
    } else {
      FileDropManager._dropResult = null;
      this._indicator.rect = null;
    }
  };

  private _onDrop = (event: DragEvent) => {
    const { onDrop } = this._fileDropOptions;
    if (!onDrop) return;

    event.preventDefault();

    // allow only external drag-and-drop files
    const effectAllowed = event.dataTransfer?.effectAllowed ?? 'none';
    if (effectAllowed !== 'all') return;

    const droppedFiles = event.dataTransfer?.files;
    if (!droppedFiles || !droppedFiles.length) return;

    const targetModel = this.targetModel;
    const place = this.type;

    const { clientX, clientY } = event;
    const point = new Point(clientX, clientY);

    onDrop({ files: [...droppedFiles], targetModel, place, point })?.catch(
      console.error
    );

    this._indicator.rect = null;
  };
}
