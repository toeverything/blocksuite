import './present/navigator-setting-button.js';

import { cssVar } from '@toeverything/theme';
import { css, html, LitElement, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { toast } from '../../../../_common/components/toast.js';
import type { NavigatorMode } from '../../../../_common/edgeless/frame/consts.js';
import {
  FrameNavigatorNextIcon,
  FrameNavigatorPrevIcon,
  NavigatorExitFullScreenIcon,
  NavigatorFullScreenIcon,
  StopAIIcon,
} from '../../../../_common/icons/edgeless.js';
import type { FrameBlockModel } from '../../../../frame-block/frame-model.js';
import { Bound, clamp } from '../../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';
import type { EdgelessTool } from '../../types.js';
import { isFrameBlock } from '../../utils/query.js';
import { launchIntoFullscreen } from '../utils.js';
import { EdgelessToolbarToolMixin } from './mixins/tool.mixin.js';

@customElement('presentation-toolbar')
export class PresentationToolbar extends EdgelessToolbarToolMixin(LitElement) {
  private get _cachedPresentHideToolbar() {
    return !!this.edgeless.service.editPropsStore.getStorage(
      'presentHideToolbar'
    );
  }

  private set _cachedPresentHideToolbar(value) {
    this.edgeless.service.editPropsStore.setStorage(
      'presentHideToolbar',
      !!value
    );
  }

  private get _frames(): FrameBlockModel[] {
    return this.edgeless.service.frames;
  }

  get host() {
    return this.edgeless.host;
  }

  static override styles = css`
    :host {
      align-items: inherit;
      width: 100%;
      height: 100%;
      gap: 8px;
      padding-right: 2px;
    }
    .full-divider {
      width: 8px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .full-divider::after {
      content: '';
      width: 1px;
      height: 100%;
      background: var(--affine-border-color);
      transform: scaleX(0.5);
    }
    .config-buttons {
      display: flex;
      gap: 10px;
    }
    .edgeless-frame-navigator {
      width: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .edgeless-frame-navigator.dense {
      width: auto;
    }

    .edgeless-frame-navigator-title {
      display: inline-block;
      cursor: pointer;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      padding-right: 8px;
    }

    .edgeless-frame-navigator-count {
      color: var(--affine-text-secondary-color);
      white-space: nowrap;
    }
    .edgeless-frame-navigator-stop {
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 8px;
      position: relative;
      overflow: hidden;

      svg {
        display: block;
      }
    }
    .edgeless-frame-navigator-stop::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      border-radius: inherit;
    }
    .edgeless-frame-navigator-stop:hover::before {
      background: var(--affine-hover-color);
    }
  `;

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

  override type: EdgelessTool['type'] = 'frameNavigator';

  @property({ attribute: false })
  accessor containerWidth = 1920;

  @property({ attribute: true, type: Boolean })
  accessor visible = true;

  @property({ type: Boolean })
  accessor settingMenuShow = false;

  @property({ type: Boolean })
  accessor frameMenuShow = false;

  get dense() {
    return this.containerWidth < 554;
  }

  constructor(edgeless: EdgelessRootBlockComponent) {
    super();
    this.edgeless = edgeless;
  }

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

  protected override updated(changedProperties: PropertyValues) {
    if (
      changedProperties.has('_currentFrameIndex') &&
      this.edgelessTool.type === 'frameNavigator'
    ) {
      this._moveToCurrentFrame();
    }
  }

  @property()
  accessor setSettingMenuShow: (show: boolean) => void = () => {};

  @property()
  accessor setFrameMenuShow: (show: boolean) => void = () => {};

  override firstUpdated() {
    const { _disposables, edgeless } = this;
    const { slots } = edgeless;

    _disposables.add(
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
      )
    );

    _disposables.add(
      slots.edgelessToolUpdated.on(tool => {
        if (tool.type === 'frameNavigator') {
          this._cachedIndex = this._currentFrameIndex;
          this._navigatorMode = tool.mode ?? this._navigatorMode;
          if (isFrameBlock(edgeless.service.selection.selectedElements[0])) {
            this._cachedIndex = this._frames.findIndex(
              frame =>
                frame.id === edgeless.service.selection.selectedElements[0].id
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
      this.edgeless.service.editPropsStore.getStorage('presentFillScreen') ===
      true
        ? 'fill'
        : 'fit';
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
        .iconContainerPadding=${0}
        .tooltip=${'Previous'}
        @click=${() => this._previousFrame()}
      >
        ${FrameNavigatorPrevIcon}
      </edgeless-tool-icon-button>

      <div class="edgeless-frame-navigator ${this.dense ? 'dense' : ''}">
        ${this.dense
          ? nothing
          : html`<span
              style="color: ${cssVar('textPrimaryColor')}"
              class="edgeless-frame-navigator-title"
              @click=${() => this._moveToCurrentFrame()}
            >
              ${frame?.title ?? 'no frame'}
            </span>`}

        <span class="edgeless-frame-navigator-count">
          ${frames.length === 0 ? 0 : current + 1} / ${frames.length}
        </span>
      </div>

      <edgeless-tool-icon-button
        .tooltip=${'Next'}
        @click=${() => this._nextFrame()}
        .iconContainerPadding=${0}
      >
        ${FrameNavigatorNextIcon}
      </edgeless-tool-icon-button>

      <div class="full-divider"></div>

      <div class="config-buttons">
        <edgeless-tool-icon-button
          .tooltip=${document.fullscreenElement
            ? 'Exit Full Screen'
            : 'Enter Full Screen'}
          @click=${() => this._toggleFullScreen()}
          .iconContainerPadding=${0}
          .iconContainerWidth=${'24px'}
        >
          ${document.fullscreenElement
            ? NavigatorExitFullScreenIcon
            : NavigatorFullScreenIcon}
        </edgeless-tool-icon-button>

        ${this.dense
          ? nothing
          : html`<edgeless-frame-order-button
              .popperShow=${this.frameMenuShow}
              .setPopperShow=${this.setFrameMenuShow}
              .frames=${this._frames}
              .edgeless=${this.edgeless}
            >
            </edgeless-frame-order-button>`}

        <edgeless-navigator-setting-button
          .edgeless=${this.edgeless}
          .hideToolbar=${this._cachedPresentHideToolbar}
          .onHideToolbarChange=${(hideToolbar: boolean) => {
            this._cachedPresentHideToolbar = hideToolbar;
          }}
          .popperShow=${this.settingMenuShow}
          .setPopperShow=${this.setSettingMenuShow}
          .frames=${this._frames}
          .includeFrameOrder=${this.dense}
        >
        </edgeless-navigator-setting-button>
      </div>

      <div class="full-divider"></div>

      <button
        class="edgeless-frame-navigator-stop"
        @click=${() => {
          this.setEdgelessTool(
            doc.readonly ? { type: 'pan', panning: false } : { type: 'default' }
          );

          document.fullscreenElement && this._toggleFullScreen();
        }}
        style="background: ${cssVar('warningColor')}"
      >
        ${StopAIIcon}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'presentation-toolbar': PresentationToolbar;
  }
}
