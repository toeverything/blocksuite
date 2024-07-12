import type { BlockSelection } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/block-std';

import { IS_MAC, IS_WINDOWS } from '@blocksuite/global/env';
import { assertExists } from '@blocksuite/global/utils';

import { matchFlavours } from '../../_common/utils/model.js';
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
              blockId: selection.blockId,
              index: 0,
              length: 0,
            },
            to: null,
          }),
        ]);
      }
    });
  };

  constructor(public rootElement: BlockElement) {
    this.rootElement.bindHotKey(
      {
        Backspace: this._handleDelete,
        'Control-d': () => {
          if (!IS_MAC) return;
          this._handleDelete();
        },
        'Control-y': ctx => {
          if (!IS_WINDOWS) return;

          ctx.get('defaultState').event.preventDefault();
          if (this._doc.canRedo) {
            this._doc.redo();
          }
        },
        Delete: this._handleDelete,
        'Mod-Backspace': () => true,
        'Mod-Shift-l': () => {
          this._createEmbedBlock();
        },
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
      },
      {
        global: true,
      }
    );
  }

  private _createEmbedBlock() {
    const rootElement = this.rootElement;
    const [_, ctx] = this.rootElement.std.command
      .chain()
      .getSelectedModels({
        mode: 'highest',
        types: ['block'],
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

    const doc = rootElement.host.doc;
    const autofill = getTitleFromSelectedModels(selectedModels);
    void promptDocTitle(rootElement.host, autofill).then(title => {
      if (title === null) return;
      const linkedDoc = convertSelectedBlocksToLinkedDoc(
        doc,
        selectedModels,
        title
      );
      const linkedDocService = rootElement.host.spec.getService(
        'affine:embed-linked-doc'
      );
      linkedDocService.slots.linkedDocCreated.emit({ docId: linkedDoc.id });
      notifyDocCreated(rootElement.host, doc);
    });
  }

  private get _currentSelection() {
    return this._selection.value;
  }

  private _deleteBlocksBySelection(selections: BlockSelection[]) {
    selections.forEach(selection => {
      const block = this._doc.getBlockById(selection.blockId);
      if (block) {
        this._doc.deleteBlock(block);
      }
    });
  }

  private get _doc() {
    return this.rootElement.doc;
  }

  private _replaceBlocksBySelection(
    selections: BlockSelection[],
    flavour: string,
    props: Record<string, unknown>
  ) {
    const current = selections[0];
    const first = this._doc.getBlockById(current.blockId);
    const firstElement = this.rootElement.host.view.getBlock(current.blockId);

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

  private get _selection() {
    return this.rootElement.host.selection;
  }
}
