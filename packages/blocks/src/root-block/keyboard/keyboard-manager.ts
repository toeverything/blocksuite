import type { BlockSelection } from '@blocksuite/block-std';
import { IS_MAC, IS_WINDOWS } from '@blocksuite/global/env';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';

import { matchFlavours } from '../../_common/utils/model.js';

export class PageKeyboardManager {
  constructor(public rootElement: BlockElement) {
    this.rootElement.bindHotKey(
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

  private get _doc() {
    return this.rootElement.doc;
  }

  private get _selection() {
    return this.rootElement.host.selection;
  }

  private get _currentSelection() {
    return this._selection.value;
  }

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
        this._selection.set([
          this._selection.create('text', {
            from: {
              index: 0,
              length: 0,
              path: selection.path,
            },
            to: null,
          }),
        ]);
      }
    });
  };

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
    const firstElement = this.rootElement.host.view.viewFromPath(
      'block',
      current.path
    );

    assertExists(first, `Cannot find block ${current.blockId}`);
    assertExists(
      firstElement,
      `Cannot find block view ${current.path.join(' -> ')}`
    );

    const parentPath = firstElement.parentPath;

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
      path: parentPath.concat(blockId),
    };
  }

  private _createEmbedBlock() {
    const rootElement = this.rootElement;
    const [_, ctx] = this.rootElement.std.command
      .chain()
      .getSelectedModels({
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
    const linkedDoc = doc.collection.createDoc({});
    linkedDoc.load(() => {
      const rootId = linkedDoc.addBlock('affine:page', {
        title: new doc.Text(''),
      });
      linkedDoc.addBlock('affine:surface', {}, rootId);
      const noteId = linkedDoc.addBlock('affine:note', {}, rootId);

      const firstBlock = selectedModels[0];
      assertExists(firstBlock);

      doc.addSiblingBlocks(
        firstBlock,
        [
          {
            flavour: 'affine:embed-linked-doc',
            pageId: linkedDoc.id,
          },
        ],
        'before'
      );

      if (
        matchFlavours(firstBlock, ['affine:paragraph']) &&
        firstBlock.type.match(/^h[1-6]$/)
      ) {
        const title = firstBlock.text.toString();
        linkedDoc.collection.setDocMeta(linkedDoc.id, {
          title,
        });

        const linkedDocRootModel = linkedDoc.getBlockById(rootId);
        assertExists(linkedDocRootModel);
        linkedDoc.updateBlock(linkedDocRootModel, {
          title: new doc.Text(title),
        });

        doc.deleteBlock(firstBlock);
        selectedModels.shift();
      }

      selectedModels.forEach(model => {
        const keys = model.keys as (keyof typeof model)[];
        const values = keys.map(key => model[key]);
        const blockProps = Object.fromEntries(
          keys.map((key, i) => [key, values[i]])
        );
        linkedDoc.addBlock(model.flavour as never, blockProps, noteId);
        doc.deleteBlock(model);
      });
    });

    const linkedDocService = rootElement.host.spec.getService(
      'affine:embed-linked-doc'
    );
    linkedDocService.slots.linkedDocCreated.emit({ docId: linkedDoc.id });
  }
}
