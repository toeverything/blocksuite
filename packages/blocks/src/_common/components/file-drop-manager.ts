import type { BlockService } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';

import {
  calcDropTarget,
  getClosestBlockElementByPoint,
  getEditorContainer,
  getModelByBlockElement,
  matchFlavours,
  Point,
} from '../../_common/utils/index.js';
import type { DragIndicator } from './drag-indicator.js';

export type onDropProps = {
  files: File[];
  targetModel: BaseBlockModel | null;
  place: 'before' | 'after';
  point: Point;
};

export type FileDropOptions = {
  flavour: string;
  maxFileSize?: number;
  matcher?: (file: File) => boolean;
  onDrop?: ({ files, targetModel, place, point }: onDropProps) => void;
};

export class FileDropManager {
  private _blockService: BlockService;
  private _fileDropOptions: FileDropOptions;

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
        this.onDrop
      );
    }
  }

  get isPageMode(): boolean {
    const editor = getEditorContainer(this._blockService.page);
    return editor.mode === 'page';
  }

  get type(): 'before' | 'after' {
    return !this._indicator.dropResult ||
      this._indicator.dropResult.type !== 'before'
      ? 'after'
      : 'before';
  }

  get targetModel(): BaseBlockModel | null {
    const pageBlock = this._blockService.page.root;
    assertExists(pageBlock);

    let targetModel = this._indicator.dropResult?.modelState.model || null;

    if (!targetModel && this.isPageMode) {
      const lastNote = pageBlock.children[pageBlock.children.length - 1];
      if (!matchFlavours(lastNote, ['affine:note'])) {
        throw new Error('The last block is not a note block.');
      }
      targetModel = lastNote.lastItem();
    }

    return targetModel;
  }

  get maxFileSize(): number {
    return this._fileDropOptions.maxFileSize ?? 10 * 1000 * 1000; // default to 10MB
  }

  onDragOver = (event: DragEvent) => {
    event.preventDefault();

    // allow only external drag-and-drop files
    const effectAllowed = event.dataTransfer?.effectAllowed ?? 'none';
    if (effectAllowed !== 'all') return;

    const { clientX, clientY } = event;
    const point = new Point(clientX, clientY);
    const element = getClosestBlockElementByPoint(point.clone());

    let result = null;
    let rect = null;
    if (element) {
      const model = getModelByBlockElement(element);
      result = calcDropTarget(point, model, element);
      if (result) {
        rect = result.rect;
      }
    }

    this._indicator.dropResult = result;
    this._indicator.rect = rect;
  };

  onDrop = async (event: DragEvent) => {
    const { matcher, onDrop } = this._fileDropOptions;
    if (!matcher || !onDrop) return;

    event.preventDefault();

    // allow only external drag-and-drop files
    const effectAllowed = event.dataTransfer?.effectAllowed ?? 'none';
    if (effectAllowed !== 'all') return;

    const droppedFiles = event.dataTransfer?.files ?? [];
    const matchedFiles = [...droppedFiles].filter(matcher);
    if (!matchedFiles.length) return;

    const targetModel = this.targetModel;
    const place = this.type;

    const { clientX, clientY } = event;
    const point = new Point(clientX, clientY);

    onDrop({ files: matchedFiles, targetModel, place, point });

    this._indicator.reset();
  };
}
