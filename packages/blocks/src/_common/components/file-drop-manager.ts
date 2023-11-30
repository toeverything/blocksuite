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
import type { AttachmentBlockProps } from '../../attachment-block/attachment-model.js';
import { turnIntoEmbedAction } from '../../attachment-block/embed.js';
import { addSiblingAttachmentBlock } from '../../attachment-block/utils.js';
import type { DragIndicator } from './drag-indicator.js';

export type FileDropRule = {
  name: string;
  maxFileSize?: number;
  embed: boolean;
  matcher: (file: File) => boolean;
  handleDropInPage?: (
    targetModel: BaseBlockModel,
    files: File[],
    place: 'before' | 'after'
  ) => void;
  handleDropInEdgeless?: (point: Point, files: File[]) => void;
};

export class FileDropManager {
  private _blockService: BlockService;
  private _fileDropRule: FileDropRule;

  private _indicator!: DragIndicator;
  private _point: Point | null = null;

  constructor(blockService: BlockService, fileDropRule: FileDropRule) {
    this._blockService = blockService;
    this._fileDropRule = fileDropRule;

    this._indicator = <DragIndicator>(
      document.querySelector('affine-drag-indicator')
    );
    if (!this._indicator) {
      this._indicator = <DragIndicator>(
        document.createElement('affine-drag-indicator')
      );
      document.body.appendChild(this._indicator);
    }

    this.onDragOver = this.onDragOver.bind(this);
    this.onDrop = this.onDrop.bind(this);

    this._blockService.disposables.addFromEvent(
      this._blockService.std.root,
      'drop',
      this.onDrop
    );
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
    return this._fileDropRule.maxFileSize ?? 10 * 1000 * 1000; // default to 10MB
  }

  onDragOver(event: DragEvent) {
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
  }

  async onDrop(event: DragEvent) {
    event.preventDefault();

    // allow only external drag-and-drop files
    const effectAllowed = event.dataTransfer?.effectAllowed ?? 'none';
    if (effectAllowed !== 'all') return;

    const { page } = this._blockService;
    const { embed, handleDropInEdgeless, matcher } = this._fileDropRule;
    const targetModel = this.targetModel;
    const place = this.type;

    const { clientX, clientY } = event;
    this._point = new Point(clientX, clientY);

    const droppedFiles = event.dataTransfer?.files ?? [];
    const matchedFiles = [...droppedFiles].filter(matcher);
    if (!matchedFiles.length) return;

    if (targetModel && !matchFlavours(targetModel, ['affine:surface'])) {
      page.captureSync();

      matchedFiles.map(file =>
        addSiblingAttachmentBlock(
          file,
          targetModel,
          this.maxFileSize,
          place
        ).then(blockId => {
          if (!blockId) return;

          if (embed) {
            const attachmentModel: BaseBlockModel<AttachmentBlockProps> | null =
              page.getBlockById(blockId);
            assertExists(attachmentModel);

            turnIntoEmbedAction(attachmentModel);
          }
        })
      );
    } else if (!this.isPageMode && handleDropInEdgeless) {
      handleDropInEdgeless(this._point, matchedFiles);
    }

    this._point = null;
    this._indicator.reset();
  }
}
