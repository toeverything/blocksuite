import '../buttons/tool-icon-button.js';
import '../buttons/toolbar-button.js';
import './shape/shape-tool-button.js';
import './brush/brush-tool-button.js';
import './connector/connector-tool-button.js';
import './note/note-tool-button.js';
import './frame/frame-order-button.js';
import './frame/frame-tool-button.js';
import './default/default-tool-button.js';
import './text/text-tool-button.js';
import './eraser/eraser-tool-button.js';
import './frame/navigator-setting-button.js';
import './template/template-tool-button.js';

import { WithDisposable } from '@blocksuite/lit';
import { baseTheme } from '@toeverything/theme';
import {
  css,
  html,
  LitElement,
  nothing,
  type PropertyValues,
  unsafeCSS,
} from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { toast } from '../../../../_common/components/toast.js';
import {
  EdgelessPresentationConsts as PresentationConsts,
  type NavigatorMode,
} from '../../../../_common/edgeless/frame/consts.js';
import {
  EdgelessImageIcon,
  EdgelessTextIcon,
  FrameNavigatorIcon,
  FrameNavigatorNextIcon,
  FrameNavigatorPrevIcon,
  NavigatorExitFullScreenIcon,
  NavigatorFullScreenIcon,
} from '../../../../_common/icons/index.js';
import type { EdgelessTool } from '../../../../_common/types.js';
import { stopPropagation } from '../../../../_common/utils/event.js';
import { getImageFilesFromLocal } from '../../../../_common/utils/filesys.js';
import type { FrameBlockModel } from '../../../../index.js';
import { Bound, clamp } from '../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { isFrameBlock } from '../../utils/query.js';
import { launchIntoFullscreen } from '../utils.js';

@customElement('edgeless-toolbar')
export class EdgelessToolbar extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      user-select: none;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      position: absolute;
      z-index: 1;
      left: calc(50%);
      transform: translateX(-50%);
      bottom: 28px;
    }

    .edgeless-toolbar-container-placeholder {
      position: absolute;
      width: 463px;
      height: 66px;
      border-radius: 40px;
      background-color: transparent;
    }

    .edgeless-toolbar-container {
      position: relative;
      display: flex;
      align-items: center;
      flex-direction: row;
      padding: 0 20px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border: 1px solid var(--affine-border-color);
      border-radius: 40px;
      height: 64px;
      transition: 0.5s ease-in-out;
    }
    .edgeless-toolbar-container[level='second'] {
      position: absolute;
      bottom: 8px;
      transform: translateY(-100%);
    }
    .edgeless-toolbar-container[hidden] {
      display: none;
    }
    .edgeless-toolbar-left-part {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
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
    .brush-and-eraser {
      display: flex;
      margin-left: 8px;
    }
    .edgeless-toolbar-right-part {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-left: 12px;
    }
    .transform-button svg {
      transition: 0.3s ease-in-out;
    }
    .transform-button:hover svg {
      transform: scale(1.15);
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

  edgeless: EdgelessPageBlockComponent;

  @state()
  private _frames: FrameBlockModel[] = [];

  @state()
  private _navigatorMode: NavigatorMode = 'fit';

  @state()
  private _hideToolbar = false;

  @state()
  private _mouseOnToolbar = true;

  @state()
  settingMenuShow = false;

  @state({
    hasChanged() {
      return true;
    },
  })
  private _currentFrameIndex = 0;
  private _timer: ReturnType<typeof setTimeout> | null = null;
  private _cachedIndex = -1;

  constructor(edgeless: EdgelessPageBlockComponent) {
    super();
    this.edgeless = edgeless;
    this._frames = edgeless.surface.frame.frames.sort(
      edgeless.surface.compare
    ) as FrameBlockModel[];
  }

  get edgelessTool() {
    return this.edgeless.edgelessTool;
  }

  setEdgelessTool = (edgelessTool: EdgelessTool) => {
    this.edgeless.tools.setEdgelessTool(edgelessTool);
  };

  private _imageLoading = false;

  private async _addImages() {
    this._imageLoading = true;
    const imageFiles = await getImageFilesFromLocal();
    await this.edgeless.addImages(imageFiles);
    this._imageLoading = false;
  }

  private _updateFrames() {
    this._frames = this.edgeless.surface.frame.frames.sort(
      this.edgeless.surface.compare
    ) as FrameBlockModel[];
  }

  private _nextFrame() {
    const frames = this._frames;
    const min = 0;
    const max = frames.length - 1;
    if (this._currentFrameIndex === frames.length - 1) {
      toast('You have reached the last frame');
    } else {
      this._currentFrameIndex = clamp(this._currentFrameIndex + 1, min, max);
    }
  }

  private _previousFrame() {
    const frames = this._frames;
    const min = 0;
    const max = frames.length - 1;
    if (this._currentFrameIndex === 0) {
      toast('You have reached the first frame');
    } else {
      this._currentFrameIndex = clamp(this._currentFrameIndex - 1, min, max);
    }
  }

  private _canHideToolbar() {
    const { type } = this.edgelessTool;
    return (
      type === 'frameNavigator' &&
      this._hideToolbar &&
      !this._mouseOnToolbar &&
      !this.settingMenuShow
    );
  }

  private _tryLoadNavigatorStateLocalRecord() {
    this._navigatorMode =
      sessionStorage.getItem(PresentationConsts.FillScreen) === 'true'
        ? 'fill'
        : 'fit';
  }

  override firstUpdated() {
    const { _disposables, edgeless } = this;
    const { slots, page } = edgeless;

    const hideToolbar = sessionStorage.getItem(PresentationConsts.HideToolbar);
    this._hideToolbar = hideToolbar === 'true';

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
          if (isFrameBlock(edgeless.selectionManager.elements[0])) {
            this._cachedIndex = this._frames.findIndex(
              frame => frame.id === edgeless.selectionManager.elements[0].id
            );
          }
          if (this._frames.length === 0)
            toast(
              'The presentation requires at least 1 frame. You can firstly create a frame.',
              5000
            );
          this._toggleFullScreen();
        }

        this._trySaveBrushStateLocalRecord();
        this._trySaveTextStateLocalRecord();
        this.requestUpdate();
      })
    );
    _disposables.add(
      page.slots.blockUpdated.on(({ flavour, type }) => {
        if (flavour === 'affine:frame' && type !== 'update') {
          requestAnimationFrame(() => {
            this._updateFrames();
          });
        }
      })
    );
    _disposables.add(
      page.slots.blockUpdated.on(e => {
        if (e.type === 'update') {
          this._updateFrames();
        }
      })
    );
    _disposables.add(page.slots.blockUpdated);
    _disposables.add(slots.viewportUpdated.on(() => this.requestUpdate()));
    _disposables.add(
      edgeless.slots.readonlyUpdated.on(() => {
        this.requestUpdate();
      })
    );
    _disposables.add(
      this.edgeless.slots.navigatorSettingUpdated.on(
        ({ hideToolbar, fillScreen }) => {
          if (hideToolbar !== undefined && hideToolbar !== this._hideToolbar) {
            this._hideToolbar = hideToolbar;
          }

          if (fillScreen !== undefined) {
            this._navigatorMode = fillScreen ? 'fill' : 'fit';
          }
        }
      )
    );

    this._tryLoadNavigatorStateLocalRecord();
  }

  private _trySaveBrushStateLocalRecord = () => {
    const edgelessTool = this.edgeless.tools.edgelessTool;
    const { type } = edgelessTool;
    if (type === 'brush') {
      sessionStorage.setItem(
        'blocksuite:' + this.edgeless.page.id + ':edgelessBrush',
        JSON.stringify({
          color: edgelessTool.color,
          lineWidth: edgelessTool.lineWidth,
        })
      );
    }
  };

  private _trySaveTextStateLocalRecord = () => {
    const edgelessTool = this.edgeless.tools.edgelessTool;
    const { type } = edgelessTool;
    if (type === 'text') {
      sessionStorage.setItem(
        'blocksuite:' + this.edgeless.page.id + ':edgelessText',
        JSON.stringify({
          color: edgelessTool.color,
        })
      );
    }
  };

  private _moveToCurrentFrame() {
    const current = this._currentFrameIndex;
    const viewport = this.edgeless.surface.viewport;
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

  protected override updated(changedProperties: PropertyValues) {
    const { type } = this.edgelessTool;
    if (
      changedProperties.has('_currentFrameIndex') &&
      type === 'frameNavigator'
    ) {
      this._moveToCurrentFrame();
    }
    if (changedProperties.has('_hideToolbar')) {
      this.edgeless.slots.navigatorSettingUpdated.emit({
        hideToolbar: this._hideToolbar,
      });
      sessionStorage.setItem(
        PresentationConsts.HideToolbar,
        this._hideToolbar.toString()
      );
    }
  }

  private _toggleFullScreen() {
    if (document.fullscreenElement) {
      this._timer && clearTimeout(this._timer);
      document.exitFullscreen().catch(console.error);
    } else {
      launchIntoFullscreen(this.edgeless.editorContainer);
      this._timer = setTimeout(() => {
        this._currentFrameIndex = this._cachedIndex;
      }, 400);
    }

    setTimeout(() => this._moveToCurrentFrame(), 400);
    this.edgeless.slots.fullScrennToggled.emit();
  }

  private get _FrameNavigator() {
    const current = this._currentFrameIndex;
    const frames = this._frames;
    const frame = frames[current];
    const { page } = this.edgeless;

    return html`
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
        .frames=${this._frames}
        .updateFrames=${this._updateFrames.bind(this)}
        .edgeless=${this.edgeless}
      >
      </edgeless-frame-order-button>
      <edgeless-tool-icon-button
        .tooltip=${document.fullscreenElement
          ? 'Exit Full Screen'
          : 'Enter Full Screen'}
        @click=${() => {
          this._toggleFullScreen();
        }}
      >
        ${document.fullscreenElement
          ? NavigatorExitFullScreenIcon
          : NavigatorFullScreenIcon}
      </edgeless-tool-icon-button>
      <edgeless-navigator-setting-button
        .edgeless=${this.edgeless}
        .hideToolbar=${this._hideToolbar}
        .onHideToolbarChange=${(hideToolbar: boolean) => {
          this._hideToolbar = hideToolbar;
        }}
        .popperShow=${this.settingMenuShow}
        .setPopperShow=${(show: boolean) => {
          this.settingMenuShow = show;
        }}
      >
      </edgeless-navigator-setting-button>
      <div class="short-divider"></div>
      <div
        class="edgeless-frame-navigator-stop"
        @click=${() => {
          this.setEdgelessTool(
            page.readonly
              ? { type: 'pan', panning: false }
              : { type: 'default' }
          );

          document.fullscreenElement && this._toggleFullScreen();
          setTimeout(() => this._moveToCurrentFrame(), 400);
        }}
      >
        Stop
      </div>
    `;
  }

  private _Tools() {
    return html`
      <div class="full-divider"></div>
      <div class="brush-and-eraser">
        <edgeless-brush-tool-button
          .edgelessTool=${this.edgelessTool}
          .edgeless=${this.edgeless}
          .setEdgelessTool=${this.setEdgelessTool}
        ></edgeless-brush-tool-button>
        <edgeless-eraser-tool-button
          .edgelessTool=${this.edgelessTool}
          .edgeless=${this.edgeless}
          .setEdgelessTool=${this.setEdgelessTool}
        ></edgeless-eraser-tool-button>
      </div>
      <div class="edgeless-toolbar-right-part">
        <edgeless-shape-tool-button
          .edgelessTool=${this.edgelessTool}
          .edgeless=${this.edgeless}
          .setEdgelessTool=${this.setEdgelessTool}
        ></edgeless-shape-tool-button>
        <edgeless-text-tool-button
          .edgelessTool=${this.edgelessTool}
          .edgeless=${this.edgeless}
          .setEdgelessTool=${this.setEdgelessTool}
        >
          ${EdgelessTextIcon}
        </edgeless-text-tool-button>
        <edgeless-toolbar-button
          class="transform-button"
          .disabled=${this._imageLoading}
          .activeMode=${'background'}
          .tooltip=${'Image'}
          .tooltipOffset=${12}
          @click=${() => this._addImages()}
        >
          ${EdgelessImageIcon}
        </edgeless-toolbar-button>
        <edgeless-template-button .edgeless=${this.edgeless}>
        </edgeless-template-button>
      </div>
    `;
  }

  private get _DefaultContent() {
    const { page } = this.edgeless;

    return html`<div class="edgeless-toolbar-left-part">
        <edgeless-default-tool-button
          .edgelessTool=${this.edgelessTool}
          .edgeless=${this.edgeless}
          .setEdgelessTool=${this.setEdgelessTool}
        ></edgeless-default-tool-button>

        <edgeless-connector-tool-button
          .edgelessTool=${this.edgelessTool}
          .edgeless=${this.edgeless}
          .setEdgelessTool=${this.setEdgelessTool}
        ></edgeless-connector-tool-button>

        ${page.readonly
          ? nothing
          : html` <edgeless-frame-tool-button
              .edgelessTool=${this.edgelessTool}
              .setEdgelessTool=${this.setEdgelessTool}
              .edgeless=${this.edgeless}
            ></edgeless-frame-tool-button>`}

        <edgeless-tool-icon-button
          .tooltip=${'Present'}
          .tooltipOffset=${17}
          .iconContainerPadding=${8}
          @click=${() => {
            this.setEdgelessTool({
              type: 'frameNavigator',
              mode: this._navigatorMode,
            });
          }}
        >
          ${FrameNavigatorIcon}
        </edgeless-tool-icon-button>
      </div>

      ${page.readonly
        ? nothing
        : html`
            <div class="short-divider"></div>
            <edgeless-note-tool-button
              .edgelessTool=${this.edgelessTool}
              .edgeless=${this.edgeless}
              .setEdgelessTool=${this.setEdgelessTool}
            ></edgeless-note-tool-button>
          `}
      ${this._Tools()} `;
  }

  override render() {
    const { type } = this.edgelessTool;
    if (this.edgeless.page.readonly && type !== 'frameNavigator') {
      return nothing;
    }

    const Content =
      type === 'frameNavigator' ? this._FrameNavigator : this._DefaultContent;

    return html`
      <style>
        .edgeless-toolbar-container {
          top: ${this._canHideToolbar() ? '100px' : '0px'};
        }
      </style>
      ${this.edgeless.edgelessTool.type === 'frameNavigator' &&
      this._hideToolbar &&
      !this._mouseOnToolbar
        ? html`<div
            class="edgeless-toolbar-container-placeholder"
            @mouseenter=${() => (this._mouseOnToolbar = true)}
          ></div>`
        : nothing}
      <div
        class="edgeless-toolbar-container"
        @dblclick=${stopPropagation}
        @mousedown=${stopPropagation}
        @pointerdown=${stopPropagation}
        @mouseenter=${() => (this._mouseOnToolbar = true)}
        @mouseleave=${() => (this._mouseOnToolbar = false)}
      >
        ${Content}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-toolbar': EdgelessToolbar;
  }
}
