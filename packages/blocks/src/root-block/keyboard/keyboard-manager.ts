import type { BlockComponent, BlockSelection } from '@blocksuite/block-std';

import { matchFlavours } from '@blocksuite/affine-shared/utils';
import { IS_MAC, IS_WINDOWS } from '@blocksuite/global/env';
import { assertExists } from '@blocksuite/global/utils';

import {
  convertSelectedBlocksToLinkedDoc,
  getTitleFromSelectedModels,
  notifyDocCreated,
  promptDocTitle,
} from '../../_common/utils/render-linked-doc.js';

export class PageKeyboardManager {
  private _handleDelete = () => {
    const blockSelections = this._currentSelection.filter(sel =>
      sel.is('block')
    );
    if (blockSelections.length === 0) {
      return;
    }

    this._doc.transact(() => {
      const selection = this._replaceBlocksBySelection(
        blockSelections,
        'affine:paragraph',
        {}
      );

      if (selection) {
        this._selection.setGroup('note', [
          this._selection.create('text', {
            from: {
              index: 0,
              length: 0,
              blockId: selection.blockId,
            },
            to: null,
          }),
        ]);
      }
    });
  };

  private get _currentSelection() {
    return this._selection.value;
  }

  private get _doc() {
    return this.rootComponent.doc;
  }

  private get _selection() {
    return this.rootComponent.host.selection;
  }

  constructor(public rootComponent: BlockComponent) {
    this.rootComponent.bindHotKey(
      {
        'Mod-z': ctx => {
          ctx.get('defaultState').event.preventDefault();

          if (this._doc.canUndo) {
            this._doc.undo();
          }
        },
        'Shift-Mod-z': ctx => {
          ctx.get('defaultState').event.preventDefault();
          if (this._doc.canRedo) {
            this._doc.redo();
          }
        },
        'Control-y': ctx => {
          if (!IS_WINDOWS) return;

          ctx.get('defaultState').event.preventDefault();
          if (this._doc.canRedo) {
            this._doc.redo();
          }
        },
        'Mod-Backspace': () => true,
        Backspace: this._handleDelete,
        Delete: this._handleDelete,
        'Control-d': () => {
          if (!IS_MAC) return;
          this._handleDelete();
        },
        'Mod-Shift-l': () => {
          this._createEmbedBlock();
        },
      },
      {
        global: true,
      }
    );
  }

  private _createEmbedBlock() {
    const rootComponent = this.rootComponent;
    const [_, ctx] = this.rootComponent.std.command
      .chain()
      .getSelectedModels({
        types: ['block'],
        mode: 'highest',
      })
      .run();
    const selectedModels = ctx.selectedModels?.filter(
      block =>
        !block.flavour.startsWith('affine:embed-') &&
        matchFlavours(doc.getParent(block), ['affine:note'])
    );

    if (!selectedModels?.length) {
      return;
    }

    const doc = rootComponent.host.doc;
    const autofill = getTitleFromSelectedModels(selectedModels);
    void promptDocTitle(rootComponent.host, autofill).then(title => {
      if (title === null) return;
      convertSelectedBlocksToLinkedDoc(doc, selectedModels, title);
      notifyDocCreated(rootComponent.host, doc);
    });
  }

  private _deleteBlocksBySelection(selections: BlockSelection[]) {
    selections.forEach(selection => {
      const block = this._doc.getBlockById(selection.blockId);
      if (block) {
        this._doc.deleteBlock(block);
      }
    });
  }

  private _replaceBlocksBySelection(
    selections: BlockSelection[],
    flavour: string,
    props: Record<string, unknown>
  ) {
    const current = selections[0];
    const first = this._doc.getBlockById(current.blockId);
    const firstElement = this.rootComponent.host.view.getBlock(current.blockId);

    assertExists(first, `Cannot find block ${current.blockId}`);
    assertExists(firstElement, `Cannot find block view ${current.blockId}`);

    const parent = this._doc.getParent(first);
    const index = parent?.children.indexOf(first);

    this._deleteBlocksBySelection(selections);

    try {
      this._doc.schema.validate(flavour, parent?.flavour);
    } catch {
      return null;
    }

    const blockId = this._doc.addBlock(flavour as never, props, parent, index);

    return {
      blockId,
      path: blockId,
    };
  }
}
