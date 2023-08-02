import '../buttons/tool-icon-button.js';
import '../buttons/toolbar-button.js';
import './shape/shape-tool-button.js';
import './brush/brush-tool-button.js';
import './connector/connector-tool-button.js';
import './note/note-tool-button.js';
import './frame/frame-order-button.js';

import {
  EdgelessEraserIcon,
  EdgelessImageIcon,
  EdgelessTextIcon,
  FrameNavigatorIcon,
  FrameNavigatorNextIcon,
  FrameNavigatorPrevIcon,
  HandIcon,
  SelectIcon,
} from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import { Bound, clamp, compare, FrameElement } from '@blocksuite/phasor';
import { css, html, LitElement, type PropertyValues } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { stopPropagation } from '../../../../__internal__/utils/event.js';
import { uploadImageFromLocal } from '../../../../__internal__/utils/filesys.js';
import type { EdgelessTool } from '../../../../__internal__/utils/types.js';
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
    }
    .edgeless-toolbar-container {
      display: flex;
      align-items: center;
      flex-direction: row;
      padding: 0 12px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 40px;
      fill: currentcolor;
    }
    .edgeless-toolbar-container[level='second'] {
      position: absolute;
      bottom: 8px;
      transform: translateY(-100%);
    }
    .edgeless-toolbar-container[hidden] {
      display: none;
    }
    .short-divider {
      width: 1px;
      height: 24px;
      margin: 0 7px;
      background-color: var(--affine-border-color);
    }
    .full-divider {
      width: 1px;
      height: 100%;
      margin: 0 7px;
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
    .edgeless-right-part {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
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

    .edgeless-frame-nativator-title {
      display: inline-block;
      cursor: pointer;
      color: #424149;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      margin-right: 4px;
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

  constructor(edgeless: EdgelessPageBlockComponent) {
    super();
    this.edgeless = edgeless;
    this._frames = edgeless.frame.frames.sort(compare);
  }

  get edgelessTool() {
    return this.edgeless.edgelessTool;
  }

  setEdgelessTool = (edgelessTool: EdgelessTool) => {
    this.edgeless.selection.setEdgelessTool(edgelessTool);
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
    this._frames = this.edgeless.frame.frames.sort(compare);
  }

  override firstUpdated() {
    const {
      _disposables,
      edgeless: { slots, surface },
    } = this;
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
  }

  private _trySaveBrushStateLocalRecord = () => {
    const edgelessTool = this.edgeless.selection.edgelessTool;
    if (edgelessTool.type === 'brush') {
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
        viewport.setViewportByBound(bound, [40, 60], true);
      }
    }
  }

  private get frameNavigatorContent() {
    const current = this._currentFrameIndex;
    const frames = this._frames;
    const frame = frames[current];
    const min = 0;
    const max = frames.length - 1;
    return html`
      <edgeless-tool-icon-button
        .tooltip=${'Previous'}
        .disabled=${current === min}
        @click=${() =>
          (this._currentFrameIndex = clamp(
            this._currentFrameIndex - 1,
            min,
            max
          ))}
      >
        ${FrameNavigatorPrevIcon}
      </edgeless-tool-icon-button>
      <div class="edgeless-frame-navigator">
        <span
          class="edgeless-frame-nativator-title"
          @click=${() =>
            (this._currentFrameIndex = this._currentFrameIndex + 1 - 1)}
          >${frame?.title ?? 'no frame'}</span
        >
        <span class="edgeless-frame-navigator-count"
          >${current + 1}/${frames.length}</span
        >
      </div>
      <edgeless-tool-icon-button
        .tooltip=${'Next'}
        .disabled=${current === max}
        @click=${() =>
          (this._currentFrameIndex = clamp(
            this._currentFrameIndex + 1,
            min,
            max
          ))}
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
      <div class="short-divider"></div>
      <div
        class="edgeless-frame-navigator-stop"
        @click=${() => this.setEdgelessTool({ type: 'default' })}
      >
        Stop
      </div>
    `;
  }

  private get defaultContent() {
    const { type } = this.edgelessTool;
    return html`<edgeless-tool-icon-button
        .tooltip=${getTooltipWithShortcut('Select', 'V')}
        .active=${type === 'default'}
        @click=${() => this.setEdgelessTool({ type: 'default' })}
      >
        ${SelectIcon}
      </edgeless-tool-icon-button>
      <edgeless-tool-icon-button
        .tooltip=${getTooltipWithShortcut('Hand', 'H')}
        .active=${type === 'pan'}
        @click=${() => this.setEdgelessTool({ type: 'pan', panning: false })}
      >
        ${HandIcon}
      </edgeless-tool-icon-button>
      <edgeless-tool-icon-button
        .tooltip=${'Frame Navigator'}
        @click=${() => {
          this.setEdgelessTool({ type: 'frameNavigator' });
          this._currentFrameIndex = 0;
        }}
      >
        ${FrameNavigatorIcon}
      </edgeless-tool-icon-button>
      <div class="short-divider"></div>
      <edgeless-note-tool-button
        .edgelessTool=${this.edgelessTool}
        .edgeless=${this.edgeless}
        .setEdgelessTool=${this.setEdgelessTool}
      ></edgeless-note-tool-button>
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
      <div class="edgeless-right-part">
        <edgeless-toolbar-button
          class="transform-button"
          .tooltip=${getTooltipWithShortcut('Text', 'T')}
          .active=${type === 'text'}
          .activeMode=${'background'}
          @click=${() => this.setEdgelessTool({ type: 'text' })}
        >
          ${EdgelessTextIcon}
        </edgeless-toolbar-button>
        <edgeless-shape-tool-button
          .edgelessTool=${this.edgelessTool}
          .edgeless=${this.edgeless}
          .setEdgelessTool=${this.setEdgelessTool}
        ></edgeless-shape-tool-button>
        <edgeless-toolbar-button
          class="transform-button"
          .disabled=${this._imageLoading}
          .activeMode=${'background'}
          .tooltip=${'Image'}
          @click=${() => this._addImages()}
        >
          ${EdgelessImageIcon}
        </edgeless-toolbar-button>
        <edgeless-connector-tool-button
          .edgelessTool=${this.edgelessTool}
          .edgeless=${this.edgeless}
          .setEdgelessTool=${this.setEdgelessTool}
        ></edgeless-connector-tool-button>
      </div>`;
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
