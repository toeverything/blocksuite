import type { FrameBlockModel, RootBlockModel } from '@blocksuite/affine-model';

import { EditPropsStore } from '@blocksuite/affine-shared/services';
import { WidgetComponent } from '@blocksuite/block-std';
import { GfxControllerIdentifier } from '@blocksuite/block-std/gfx';
import { Bound } from '@blocksuite/global/utils';
import { effect } from '@preact/signals-core';
import { css, html, nothing } from 'lit';
import { state } from 'lit/decorators.js';

import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';

export const EDGELESS_NAVIGATOR_BLACK_BACKGROUND_WIDGET =
  'edgeless-navigator-black-background';
export class EdgelessNavigatorBlackBackgroundWidget extends WidgetComponent<
  RootBlockModel,
  EdgelessRootBlockComponent
> {
  static override styles = css`
    .edgeless-navigator-black-background {
      background-color: black;
      position: absolute;
      z-index: 1;
      background-color: transparent;
      box-shadow: 0 0 0 5000px black;
    }
  `;

  private _blackBackground = false;

  get gfx() {
    return this.std.get(GfxControllerIdentifier);
  }

  private _tryLoadBlackBackground() {
    const value = this.std
      .get(EditPropsStore)
      .getStorage('presentBlackBackground');
    this._blackBackground = value ?? true;
  }

  override firstUpdated() {
    const { _disposables, gfx, block } = this;
    _disposables.add(
      block.slots.navigatorFrameChanged.on(frame => {
        this.frame = frame;
      })
    );

    _disposables.add(
      block.slots.navigatorSettingUpdated.on(({ blackBackground }) => {
        if (blackBackground !== undefined) {
          this.std
            .get(EditPropsStore)
            .setStorage('presentBlackBackground', blackBackground);

          this._blackBackground = blackBackground;

          this.show =
            blackBackground &&
            block.gfx.tool.currentToolOption$.peek().type === 'frameNavigator';
        }
      })
    );

    _disposables.add(
      effect(() => {
        const tool = gfx.tool.currentToolName$.value;

        if (tool !== 'frameNavigator') {
          this.show = false;
        } else {
          this.show = this._blackBackground;
        }
      })
    );

    _disposables.add(
      block.slots.fullScreenToggled.on(
        () =>
          setTimeout(() => {
            this.requestUpdate();
          }, 500) // wait for full screen animation
      )
    );

    this._tryLoadBlackBackground();
  }

  override render() {
    const { frame, show, gfx } = this;

    if (!show || !frame) return nothing;

    const bound = Bound.deserialize(frame.xywh);
    const zoom = gfx.viewport.zoom;
    const width = bound.w * zoom;
    const height = bound.h * zoom;
    const [x, y] = gfx.viewport.toViewCoord(bound.x, bound.y);

    return html` <style>
        .edgeless-navigator-black-background {
          width: ${width}px;
          height: ${height}px;
          top: ${y}px;
          left: ${x}px;
        }
      </style>
      <div class="edgeless-navigator-black-background"></div>`;
  }

  @state()
  private accessor frame: FrameBlockModel | undefined = undefined;

  @state()
  private accessor show = false;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-navigator-black-background': EdgelessNavigatorBlackBackgroundWidget;
  }
}
