import type { PeekViewService } from '@blocksuite/affine-components/peek';
import type { RefNodeSlots } from '@blocksuite/affine-components/rich-text';
import type { BlockComponent } from '@blocksuite/block-std';

import { RootBlockSchema } from '@blocksuite/affine-model';
import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import { BlockService } from '@blocksuite/block-std';

import type { RootBlockComponent } from './types.js';

import {
  FileDropManager,
  type FileDropOptions,
} from '../_common/components/file-drop-manager.js';
import { DEFAULT_IMAGE_PROXY_ENDPOINT } from '../_common/consts.js';
import { ExportManager } from '../_common/export-manager/export-manager.js';
import {
  HtmlTransformer,
  MarkdownTransformer,
  ZipTransformer,
} from '../_common/transformers/index.js';

export abstract class RootService extends BlockService {
  static override readonly flavour = RootBlockSchema.model.flavour;

  private _exportOptions = {
    imageProxyEndpoint: DEFAULT_IMAGE_PROXY_ENDPOINT,
  };

  private _fileDropOptions: FileDropOptions = {
    flavour: this.flavour,
  };

  readonly exportManager = new ExportManager(this, this._exportOptions);

  readonly fileDropManager = new FileDropManager(this, this._fileDropOptions);

  peekViewService: PeekViewService | null = null;

  abstract slots: RefNodeSlots;

  readonly themeObserver = ThemeObserver.instance;

  transformers = {
    markdown: MarkdownTransformer,
    html: HtmlTransformer,
    zip: ZipTransformer,
  };

  get selectedBlocks() {
    let result: BlockComponent[] = [];
    this.std.command
      .chain()
      .tryAll(chain => [
        chain.getTextSelection(),
        chain.getImageSelections(),
        chain.getBlockSelections(),
      ])
      .getSelectedBlocks()
      .inline(({ selectedBlocks }) => {
        if (!selectedBlocks) return;
        result = selectedBlocks;
      })
      .run();
    return result;
  }

  get selectedModels() {
    return this.selectedBlocks.map(block => block.model);
  }

  get viewportElement() {
    const rootId = this.std.doc.root?.id;
    if (!rootId) return null;
    const rootComponent = this.std.view.getBlock(
      rootId
    ) as RootBlockComponent | null;
    if (!rootComponent) return null;
    const viewportElement = rootComponent.viewportElement;
    return viewportElement;
  }

  override mounted() {
    super.mounted();

    this.disposables.addFromEvent(
      this.host,
      'dragover',
      this.fileDropManager.onDragOver
    );

    this.disposables.addFromEvent(
      this.host,
      'dragleave',
      this.fileDropManager.onDragLeave
    );

    this.disposables.add(
      this.std.event.add('pointerDown', ctx => {
        const state = ctx.get('pointerState');
        state.raw.stopPropagation();
      })
    );
  }
}

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:page': RootService;
    }
  }
}
