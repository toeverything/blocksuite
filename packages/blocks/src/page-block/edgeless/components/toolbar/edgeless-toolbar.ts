import '../buttons/tool-icon-button.js';
import '../buttons/toolbar-button.js';
import './shape/shape-tool-button.js';
import './brush/brush-tool-button.js';
import './connector/connector-tool-button.js';
import './note/note-tool-button.js';
import './frame/frame-order-button.js';
import './frame/frame-tool-button.js';

import { launchIntoFullscreen } from '@blocksuite/global/utils';
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

import { stopPropagation } from '../../../../__internal__/utils/event.js';
import { uploadImageFromLocal } from '../../../../__internal__/utils/filesys.js';
import type { EdgelessTool } from '../../../../__internal__/utils/types.js';
import { toast } from '../../../../components/toast.js';
import {
  EdgelessEraserIcon,
  EdgelessImageIcon,
  EdgelessTextIcon,
  FrameNavigatorIcon,
  FrameNavigatorNextIcon,
  FrameNavigatorPrevIcon,
  HandIcon,
  PresentationExitFullScreenIcon,
  PresentationFullScreenIcon,
  SelectIcon,
} from '../../../../icons/index.js';
import {
  Bound,
  clamp,
  compare,
  FrameElement,
} from '../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { getTooltipWithShortcut } from '../utils.js';

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
      min-height: 52px;
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
      gap: 10px;
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
    .eraser-button {
      position: relative;
      height: 66px;
      width: 30px;
      overflow-y: hidden;
    }
    #edgeless-eraser-icon {
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      transition: top 0.3s ease-in-out;
    }
    #edgeless-eraser-icon:hover {
      top: 2px;
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
  private _frames: FrameElement[] = [];

  @state({
    hasChanged() {
      return true;
    },
  })
  private _currentFrameIndex = 0;
  private _timer: ReturnType<typeof setTimeout> | null = null;
  private _index = -1;

  constructor(edgeless: EdgelessPageBlockComponent) {
    super();
    this.edgeless = edgeless;
    this._frames = edgeless.surface.frame.frames.sort(compare);
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

    const fileInfos = await uploadImageFromLocal(this.edgeless.page.blobs);

    if (!fileInfos.length) {
      this._imageLoading = false;
      return;
    }

    await this.edgeless.addImages(fileInfos);

    this._imageLoading = false;
  }

  private _updateFrames() {
    this._frames = this.edgeless.surface.frame.frames.sort(compare);
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
    const { slots, surface } = edgeless;

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
      slots.edgelessToolUpdated.on(() => {
        this._trySaveBrushStateLocalRecord();
        this.requestUpdate();
      })
    );
    _disposables.add(
      surface.slots.elementAdded.on(id => {
        const element = surface.pickById(id);
        if (element instanceof FrameElement) {
          this._updateFrames();
        }
      })
    );
    _disposables.add(
      surface.slots.elementRemoved.on(({ element }) => {
        if (element instanceof FrameElement) {
          this._updateFrames();
        }
      })
    );
    _disposables.add(
      surface.slots.elementUpdated.on(({ id, props }) => {
        const element = surface.pickById(id);
        if (element instanceof FrameElement && 'index' in props) {
          this._updateFrames();
        }
      })
    );
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

  protected override updated(changedProperties: PropertyValues) {
    const { type } = this.edgelessTool;
    if (
      changedProperties.has('_currentFrameIndex') &&
      type === 'frameNavigator'
    ) {
      const current = this._currentFrameIndex;
      const viewport = this.edgeless.surface.viewport;
      const frame = this._frames[current];
      if (frame) {
        const bound = Bound.deserialize(frame.xywh);
        viewport.setViewportByBound(bound, [40, 60, 40, 60], true);
      }
    }
  }

  private _toggleFullScreen() {
    if (document.fullscreenElement) {
      this._timer && clearTimeout(this._timer);
      document.exitFullscreen();
    } else {
      launchIntoFullscreen(this.edgeless.editorContainer);
      this._timer = setTimeout(() => {
        this._currentFrameIndex = this._index;
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
          ? PresentationExitFullScreenIcon
          : PresentationFullScreenIcon}
      </edgeless-tool-icon-button>
      <div class="short-divider"></div>
      <div
        class="edgeless-frame-navigator-stop"
        @click=${() => {
          this.setEdgelessTool({ type: 'default' });
          document.fullscreenElement && this._toggleFullScreen();
        }}
      >
        Stop
      </div>
    `;
  }

  private _renderTools() {
    const { page } = this.edgeless;
    const { type } = this.edgelessTool;

    if (page.readonly) return nothing;

    return html`
      <div class="full-divider"></div>
      <div class="brush-and-eraser">
        <edgeless-brush-tool-button
          .edgelessTool=${this.edgelessTool}
          .edgeless=${this.edgeless}
          .setEdgelessTool=${this.setEdgelessTool}
        ></edgeless-brush-tool-button>
        <edgeless-toolbar-button
          .tooltip=${getTooltipWithShortcut('Eraser', 'E')}
          .active=${type === 'eraser'}
          .activeMode=${'background'}
          @click=${() => this.setEdgelessTool({ type: 'eraser' })}
        >
          <div class="eraser-button">${EdgelessEraserIcon}</div>
        </edgeless-toolbar-button>
      </div>
      <div class="edgeless-toolbar-right-part">
        <edgeless-toolbar-button
          class="transform-button"
          .tooltip=${getTooltipWithShortcut('Text', 'T')}
          .active=${type === 'text'}
          .activeMode=${'background'}
          @click=${() => this.setEdgelessTool({ type: 'text' })}
        >
          ${EdgelessTextIcon}
        </edgeless-toolbar-button>
        <edgeless-toolbar-button
          class="transform-button"
          .disabled=${this._imageLoading}
          .activeMode=${'background'}
          .tooltip=${'Image'}
          @click=${() => this._addImages()}
        >
          ${EdgelessImageIcon}
        </edgeless-toolbar-button>
        <edgeless-shape-tool-button
          .edgelessTool=${this.edgelessTool}
          .edgeless=${this.edgeless}
          .setEdgelessTool=${this.setEdgelessTool}
        ></edgeless-shape-tool-button>
        <edgeless-connector-tool-button
          .edgelessTool=${this.edgelessTool}
          .edgeless=${this.edgeless}
          .setEdgelessTool=${this.setEdgelessTool}
        ></edgeless-connector-tool-button>
      </div>
    `;
  }

  private get defaultContent() {
    const { page } = this.edgeless;
    const { type } = this.edgelessTool;

    return html`<div class="edgeless-toolbar-left-part">
        <edgeless-tool-icon-button
          .tooltip=${getTooltipWithShortcut('Select', 'V')}
          .active=${type === 'default'}
          .iconContainerPadding=${4}
          @click=${() => this.setEdgelessTool({ type: 'default' })}
        >
          ${SelectIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .tooltip=${getTooltipWithShortcut('Hand', 'H')}
          .active=${type === 'pan'}
          .iconContainerPadding=${4}
          @click=${() => this.setEdgelessTool({ type: 'pan', panning: false })}
        >
          ${HandIcon}
        </edgeless-tool-icon-button>

        ${page.readonly
          ? nothing
          : html` <edgeless-frame-tool-button
              .edgelessTool=${this.edgelessTool}
              .setEdgelessTool=${this.setEdgelessTool}
              .edgeless=${this.edgeless}
            ></edgeless-frame-tool-button>`}

        <edgeless-tool-icon-button
          .tooltip=${'Presentation'}
          .iconContainerPadding=${4}
          @click=${() => {
            this._index = this._currentFrameIndex;
            if (
              this.edgeless.selectionManager.elements[0] instanceof FrameElement
            ) {
              this._index = this._frames.findIndex(
                frame =>
                  frame.id === this.edgeless.selectionManager.elements[0].id
              );
            }
            this.setEdgelessTool({ type: 'frameNavigator' });
            if (this._frames.length === 0)
              toast(
                'The presentation requires at least 1 frame. You can firstly create a frame.',
                5000
              );
            this._toggleFullScreen();
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
        @mouseup=${stopPropagation}
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
