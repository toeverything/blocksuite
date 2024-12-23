import type { ReactiveController } from 'lit';

import type { DataViewTable } from '../table-view.js';

export class TableHotkeysController implements ReactiveController {
  get selectionController() {
    return this.host.selectionController;
  }

  constructor(private host: DataViewTable) {
    this.host.addController(this);
  }

  hostConnected() {
    this.host.disposables.add(
      this.host.props.bindHotkey({
        'Mod-a': () => {
          return;
          // const selection = this.selectionController.selection;
          // if (TableRowSelection.is(selection)) {
          //   return false;
          // }
          // if (!selection) {
          //   const microsheet = this.host.closest('affine-microsheet');
          //   assertExists(microsheet);
          //   if (!(microsheet instanceof CaptionedBlockComponent)) {
          //     return false;
          //   }
          //   const stdSelection = this.host.std.selection;

          //   stdSelection.set([
          //     stdSelection.create('block', {
          //       blockId: microsheet.blockId,
          //     }),
          //   ]);
          //   return true;
          // }
          // if (selection?.isEditing) {
          //   return true;
          // }
          // if (selection) {
          //   context.get('keyboardState').raw.preventDefault();
          //   this.selectionController.selection = TableRowSelection.create({
          //     rows:
          //       this.host.props.view.groupManager.groupsDataList$.value?.flatMap(
          //         group => group.rows.map(id => ({ groupKey: group.key, id }))
          //       ) ??
          //       this.host.props.view.rows$.value.map(id => ({
          //         groupKey: undefined,
          //         id,
          //       })),
          //   });
          //   return true;
          // }
          // return;
        },
      })
    );
  }
}
