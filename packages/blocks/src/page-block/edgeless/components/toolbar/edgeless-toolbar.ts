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
import type { NavigatorMode } from '../../../../_common/edgeless/frame/consts.js';
import {
  EdgelessImageIcon,
  EdgelessTextIcon,
  FrameNavigatorIcon,
  FrameNavigatorNextIcon,
  FrameNavigatorPrevIcon,
  NavigatorExitFullScreenIcon,
  NavigatorFullScreenIcon,
} from '../../../../_common/icons/index.js';
import { stopPropagation } from '../../../../_common/utils/event.js';
import { uploadImageFromLocal } from '../../../../_common/utils/filesys.js';
import type { EdgelessTool } from '../../../../_common/utils/types.js';
import type { FrameBlockModel } from '../../../../index.js';
import { EdgelessBlockType } from '../../../../surface-block/edgeless-types.js';
import { Bound, clamp } from '../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { isFrameBlock } from '../../utils/query.js';

const { FRAME } = EdgelessBlockType;

export function launchIntoFullscreen(element: Element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (
    'mozRequestFullScreen' in element &&
    element.mozRequestFullScreen instanceof Function
  ) {
    // Firefox
    element.mozRequestFullScreen();
  } else if (
    'webkitRequestFullscreen' in element &&
    element.webkitRequestFullscreen instanceof Function
  ) {
    // Chrome, Safari and Opera
    element.webkitRequestFullscreen();
  } else if (
    'msRequestFullscreen' in element &&
    element.msRequestFullscreen instanceof Function
  ) {
    // IE/Edge
    element.msRequestFullscreen();
  }
}

@customElement('edgeless-toolbar')
export class EdgelessToolbar extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      position: absolute;
      z-index: 3;
      bottom: 28px;
      left: calc(50%);
      display: flex;
      justify-content: center;
      transform: translateX(-50%);
      user-select: none;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    }
    .edgeless-toolbar-container {
      display: flex;
      align-items: center;
      flex-direction: row;
      padding: 0 20px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border: 1px solid var(--affine-border-color);
      border-radius: 40px;
      height: 64px;
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
    this._frames = edgeless.surface.frame.frames.sort(edgeless.surface.compare);
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

    const fileInfos = await uploadImageFromLocal(this.edgeless.page.blob);

    if (!fileInfos.length) {
      this._imageLoading = false;
      return;
    }

    await this.edgeless.addImages(fileInfos);

    this._imageLoading = false;
  }

  private _updateFrames() {
    this._frames = this.edgeless.surface.frame.frames.sort(
      this.edgeless.surface.compare
    );
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

  override firstUpdated() {
    const { _disposables, edgeless } = this;
    const { slots, page } = edgeless;

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
        if (flavour === FRAME && type !== 'update') {
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
  }

  private _toggleFullScreen() {
    if (document.fullscreenElement) {
      this._timer && clearTimeout(this._timer);
      document.exitFullscreen();
    } else {
      launchIntoFullscreen(this.edgeless.editorContainer);
      this._timer = setTimeout(() => {
        this._currentFrameIndex = this._cachedIndex;
      }, 400);
    }
  }

  private get frameNavigatorContent() {
    const current = this._currentFrameIndex;
    const frames = this._frames;
    const frame = frames[current];
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
      <div class="short-divider"></div>
      <div
        class="edgeless-frame-navigator-stop"
        @click=${() => {
          this.setEdgelessTool({ type: 'default' });
          document.fullscreenElement && this._toggleFullScreen();
          setTimeout(() => this._moveToCurrentFrame(), 400);
        }}
      >
        Stop
      </div>
    `;
  }

  private _renderTools() {
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
      </div>
    `;
  }

  private get defaultContent() {
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
          .tooltip=${'Presentation'}
          .tooltipOffset=${17}
          .iconContainerPadding=${8}
          @click=${() => {
            this.setEdgelessTool({ type: 'frameNavigator' });
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
      ${this._renderTools()} `;
  }

  override render() {
    if (this.edgeless.page.readonly) return nothing;

    const { type } = this.edgelessTool;

    const Content =
      type === 'frameNavigator'
        ? this.frameNavigatorContent
        : this.defaultContent;
    return html`
      <div
        class="edgeless-toolbar-container"
        @dblclick=${stopPropagation}
        @mousedown=${stopPropagation}
        @pointerdown=${stopPropagation}
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
