/* eslint-disable */
import type {
  BaseSelection,
  BlockComponent,
  UIEventHandler,
  UIEventStateContext,
} from '@blocksuite/block-std';
import type { ReactiveController } from 'lit';

import type { ReactiveControllerHost } from 'lit';
import type { BlockModel } from '@blocksuite/store';

export const ensureBlockInContainer = (
  blockElement: BlockComponent,
  containerElement: BlockComponent
) =>
  containerElement.contains(blockElement) && blockElement !== containerElement;

export class KeymapController implements ReactiveController {
  private _onEnter = () => {
    const [result] = this._std.command
      // @ts-expect-error
      .pipe()
      .getBlockSelections()
      // @ts-expect-error
      .inline((ctx, next) => {
        const blockSelection = ctx.currentBlockSelections?.at(-1);
        if (!blockSelection) {
          return;
        }

        const { view, page, selection } = ctx.std;

        const element = view.viewFromPath('block', blockSelection.path);
        if (!element) {
          return;
        }

        const { model } = element;
        const parent = page.getParent(model);
        console.log(model, parent);
        if (!parent) {
          return;
        }

        const index = parent.children.indexOf(model) ?? undefined;

        const blockId = page.addBlock(
          'affine:paragraph',
          {},
          parent,
          index + 1
        );

        const sel = selection.create('text', {
          from: {
            path: element.parentPath.concat(blockId),
            index: 0,
            length: 0,
          },
          to: null,
        });

        selection.setGroup('cell', [sel]);

        return next();
      })
      .run();

    return result;
  };

  private _onSelectAll: UIEventHandler = () => {
    const childrenModels = this.host.model.children;
    if (
      this._std.selection.filter('block').length === childrenModels.length &&
      this._std.selection
        .filter('block')
        .every((block: BaseSelection) =>
          childrenModels.some((model: BlockModel) => model.id === block.blockId)
        )
    ) {
      return;
    }
    const childrenBlocksSelection = this.host.model.children.map(
      (model: BlockModel) =>
        this._std.selection.create('block', { blockId: model.id })
    );
    this._std.selection.setGroup('note', childrenBlocksSelection);
    return true;
  };

  private _reset = () => {};

  bind = () => {
    this.host.handleEvent('keyDown', (ctx: UIEventStateContext) => {
      const state = ctx.get('keyboardState');
      if (state.raw.key === 'Shift') {
        return;
      }
      this._reset();
    });

    this.host.bindHotKey({
      Enter: this._onEnter,
      'Mod-a': this._onSelectAll,
    });
  };

  host: ReactiveControllerHost & BlockComponent;

  private get _std() {
    return this.host.std;
  }

  constructor(host: ReactiveControllerHost & BlockComponent) {
    (this.host = host).addController(this);
  }

  hostConnected() {
    this._reset();
  }

  hostDisconnected() {
    this._reset();
  }
}
