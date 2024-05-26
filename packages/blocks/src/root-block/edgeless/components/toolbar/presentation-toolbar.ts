import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { toast } from '../../../../_common/components/toast.js';
import type { NavigatorMode } from '../../../../_common/edgeless/frame/consts.js';
import {
  FrameNavigatorNextIcon,
  FrameNavigatorPrevIcon,
  NavigatorExitFullScreenIcon,
  NavigatorFullScreenIcon,
} from '../../../../_common/icons/edgeless.js';
import type { EdgelessTool } from '../../../../_common/types.js';
import type { FrameBlockModel } from '../../../../frame-block/frame-model.js';
import { Bound, clamp } from '../../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';
import { isFrameBlock } from '../../utils/query.js';
import { launchIntoFullscreen } from '../utils.js';

@customElement('presentation-toolbar')
export class PresentationToolbar extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      align-items: inherit;
    }
    .short-divider {
      width: 1px;
      height: 24px;
      margin: 0 10px;
      background-color: var(--affine-border-color);
    }
    .full-divider {
      width: 1px;
      height: 100%;
      margin: 0 12px;
      background-color: var(--affine-border-color);
    }
    .edgeless-frame-navigator {
      width: 145px;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .edgeless-frame-navigator-title {
      display: inline-block;
      cursor: pointer;
      color: #424149;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      margin-right: 8px;
    }

    .edgeless-frame-navigator-count {
      color: #8e8d91;
    }
    .edgeless-frame-navigator-stop {
      background: #eb4335;
      color: #ffffff;
      box-shadow: 0px 1px 2px 0px #ffffff40 inset;
      padding: 4px 10px;
      border-radius: 8px;
      cursor: pointer;
    }
  `;

  edgeless: EdgelessRootBlockComponent;

  private get _cachedPresentHideToolbar() {
    return !!this.edgeless.service.editPropsStore.getItem('presentHideToolbar');
  }
  private set _cachedPresentHideToolbar(value) {
    this.edgeless.service.editPropsStore.setItem('presentHideToolbar', !!value);
  }

  @property({ attribute: true, type: Boolean })
  accessor visible = true;

  @property({ type: Boolean })
  accessor settingMenuShow = false;
  @property()
  accessor setSettingMenuShow: (show: boolean) => void = () => {};

  @property({ type: Boolean })
  accessor frameMenuShow = false;
  @property()
  accessor setFrameMenuShow: (show: boolean) => void = () => {};

  @state()
  private accessor _navigatorMode: NavigatorMode = 'fit';

  @state({
    hasChanged() {
      return true;
    },
  })
  private accessor _currentFrameIndex = 0;
  private _timer?: ReturnType<typeof setTimeout>;
  private _cachedIndex = -1;

  private get _frames(): FrameBlockModel[] {
    return this.edgeless.service.frames;
  }

  get host() {
    return this.edgeless.host;
  }

  get edgelessTool() {
    return this.edgeless.edgelessTool;
  }

  constructor(edgeless: EdgelessRootBlockComponent) {
    super();
    this.edgeless = edgeless;
  }

  setEdgelessTool = (edgelessTool: EdgelessTool) => {
    this.edgeless.tools.setEdgelessTool(edgelessTool);
  };

  private _nextFrame() {
    const frames = this._frames;
    const min = 0;
    const max = frames.length - 1;
    if (this._currentFrameIndex === frames.length - 1) {
      toast(this.host, 'You have reached the last frame');
    } else {
      this._currentFrameIndex = clamp(this._currentFrameIndex + 1, min, max);
    }
  }

  private _previousFrame() {
    const frames = this._frames;
    const min = 0;
    const max = frames.length - 1;
    if (this._currentFrameIndex === 0) {
      toast(this.host, 'You have reached the first frame');
    } else {
      this._currentFrameIndex = clamp(this._currentFrameIndex - 1, min, max);
    }
  }

  private _moveToCurrentFrame() {
    const current = this._currentFrameIndex;
    const viewport = this.edgeless.service.viewport;
    const frame = this._frames[current];

    if (frame) {
      let bound = Bound.deserialize(frame.xywh);

      if (this._navigatorMode === 'fill') {
        const vb = viewport.viewportBounds;
        const center = bound.center;
        let w, h;
        if (vb.w / vb.h > bound.w / bound.h) {
          w = bound.w;
          h = (w * vb.h) / vb.w;
        } else {
          h = bound.h;
          w = (h * vb.w) / vb.h;
        }
        bound = Bound.fromCenter(center, w, h);
      }

      viewport.setViewportByBound(bound, [0, 0, 0, 0], false);
      this.edgeless.slots.navigatorFrameChanged.emit(
        this._frames[this._currentFrameIndex]
      );
    }
  }

  private _toggleFullScreen() {
    if (document.fullscreenElement) {
      clearTimeout(this._timer);
      document.exitFullscreen().catch(console.error);
    } else {
      launchIntoFullscreen(this.edgeless.viewportElement);
      this._timer = setTimeout(() => {
        this._currentFrameIndex = this._cachedIndex;
      }, 400);
    }

    setTimeout(() => this._moveToCurrentFrame(), 400);
    this.edgeless.slots.fullScreenToggled.emit();
  }

  override firstUpdated() {
    const { _disposables, edgeless } = this;
    const { slots } = edgeless;

    edgeless.bindHotKey(
      {
        ArrowLeft: () => {
          const { type } = this.edgelessTool;
          if (type !== 'frameNavigator') return;
          this._previousFrame();
        },
        ArrowRight: () => {
          const { type } = this.edgelessTool;
          if (type !== 'frameNavigator') return;
          this._nextFrame();
        },
      },
      {
        global: true,
      }
    );

    _disposables.add(
      slots.edgelessToolUpdated.on(tool => {
        if (tool.type === 'frameNavigator') {
          this._cachedIndex = this._currentFrameIndex;
          this._navigatorMode = tool.mode ?? this._navigatorMode;
          if (isFrameBlock(edgeless.service.selection.elements[0])) {
            this._cachedIndex = this._frames.findIndex(
              frame => frame.id === edgeless.service.selection.elements[0].id
            );
          }
          if (this._frames.length === 0)
            toast(
              this.host,
              'The presentation requires at least 1 frame. You can firstly create a frame.',
              5000
            );
          this._toggleFullScreen();
        }

        this.requestUpdate();
      })
    );

    _disposables.add(
      edgeless.slots.navigatorSettingUpdated.on(({ fillScreen }) => {
        if (fillScreen !== undefined) {
          this._navigatorMode = fillScreen ? 'fill' : 'fit';
        }
      })
    );

    this._navigatorMode =
      this.edgeless.service.editPropsStore.getItem('presentFillScreen') === true
        ? 'fill'
        : 'fit';
  }

  protected override updated(changedProperties: PropertyValues) {
    if (
      changedProperties.has('_currentFrameIndex') &&
      this.edgelessTool.type === 'frameNavigator'
    ) {
      this._moveToCurrentFrame();
    }
  }

  override render() {
    const current = this._currentFrameIndex;
    const frames = this._frames;
    const frame = frames[current];
    const { doc } = this.edgeless;

    return html`
      <style>
        :host {
          display: ${this.visible ? 'flex' : 'none'};
        }
      </style>
      <edgeless-tool-icon-button
        .tooltip=${'Previous'}
        @click=${() => this._previousFrame()}
      >
        ${FrameNavigatorPrevIcon}
      </edgeless-tool-icon-button>

      <div class="edgeless-frame-navigator">
        <span
          class="edgeless-frame-navigator-title"
          @click=${() =>
            (this._currentFrameIndex = this._currentFrameIndex + 0)}
          >${frame?.title ?? 'no frame'}</span
        >

        <span class="edgeless-frame-navigator-count"
          >${frames.length === 0 ? 0 : current + 1}/${frames.length}</span
        >
      </div>

      <edgeless-tool-icon-button
        .tooltip=${'Next'}
        @click=${() => this._nextFrame()}
      >
        ${FrameNavigatorNextIcon}
      </edgeless-tool-icon-button>

      <div class="short-divider"></div>

      <edgeless-frame-order-button
        .popperShow=${this.frameMenuShow}
        .setPopperShow=${this.setFrameMenuShow}
        .frames=${this._frames}
        .edgeless=${this.edgeless}
      >
      </edgeless-frame-order-button>

      <edgeless-tool-icon-button
        .tooltip=${document.fullscreenElement
          ? 'Exit Full Screen'
          : 'Enter Full Screen'}
        @click=${() => this._toggleFullScreen()}
      >
        ${document.fullscreenElement
          ? NavigatorExitFullScreenIcon
          : NavigatorFullScreenIcon}
      </edgeless-tool-icon-button>

      <edgeless-navigator-setting-button
        .edgeless=${this.edgeless}
        .hideToolbar=${this._cachedPresentHideToolbar}
        .onHideToolbarChange=${(hideToolbar: boolean) => {
          this._cachedPresentHideToolbar = hideToolbar;
        }}
        .popperShow=${this.settingMenuShow}
        .setPopperShow=${this.setSettingMenuShow}
      >
      </edgeless-navigator-setting-button>

      <div class="short-divider"></div>

      <div
        class="edgeless-frame-navigator-stop"
        @click=${() => {
          this.setEdgelessTool(
            doc.readonly ? { type: 'pan', panning: false } : { type: 'default' }
          );

          document.fullscreenElement && this._toggleFullScreen();
        }}
      >
        Stop
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'presentation-toolbar': PresentationToolbar;
  }
}
