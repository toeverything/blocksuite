import './component-toolbar-menu-divider.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import { toast } from '../../../../_common/components/toast.js';
import { NoteIcon, RenameIcon } from '../../../../_common/icons/index.js';
import type { CssVariableName } from '../../../../_common/theme/css-variables.js';
import type { FrameBlockModel } from '../../../../frame-block/index.js';
import {
  deserializeXYWH,
  serializeXYWH,
} from '../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';
import { DEFAULT_NOTE_HEIGHT } from '../../utils/consts.js';
import { mountFrameTitleEditor } from '../../utils/text.js';
import type { EdgelessToolIconButton } from '../buttons/tool-icon-button.js';
import type { ColorEvent } from '../panel/color-panel.js';
import { ColorUnit } from '../panel/color-panel.js';
import { createButtonPopper } from '../utils.js';

const FRAME_BACKGROUND: CssVariableName[] = [
  '--affine-tag-gray',
  '--affine-tag-red',
  '--affine-tag-orange',
  '--affine-tag-yellow',
  '--affine-tag-green',
  '--affine-tag-teal',
  '--affine-tag-blue',
  '--affine-tag-purple',
  '--affine-tag-pink',
  '--affine-palette-transparent',
];

@customElement('edgeless-change-frame-button')
export class EdgelessChangeFrameButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--affine-text-primary-color);
      stroke: none;
      fill: currentColor;
    }

    edgeless-color-panel {
      width: 168px;
    }

    .fill-color-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 20px;
      height: 20px;
    }

    .color-panel-container,
    .image-background-container {
      display: none;
      justify-content: center;
      align-items: center;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
    }

    .color-panel-container[data-show],
    .image-background-container[data-show] {
      display: flex;
    }
    component-toolbar-menu-divider {
      margin: 0 12px;
      height: 24px;
    }
  `;
  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  @property({ attribute: false })
  frames: FrameBlockModel[] = [];

  @state()
  private _popperShow = false;

  @query('.fill-color-button')
  private _fillColorButton!: EdgelessToolIconButton;
  @query('.color-panel-container.fill-color')
  private _fillColorMenu!: HTMLDivElement;
  private _frameBackground: ReturnType<typeof createButtonPopper> | null = null;

  private _setFrameBackground(color: CssVariableName) {
    this.frames.forEach(frame => {
      this.surface.updateElement(frame.id, { background: color });
    });
  }

  private _insertIntoPage() {
    if (!this.surface.page.root) return;

    const root = this.surface.page.root;
    const pageChildren = root.children;
    const last = pageChildren[pageChildren.length - 1];
    const referenceFrame = this.frames[0];

    let targetParent = last?.id;

    if (last?.flavour !== 'affine:note') {
      const targetXYWH = deserializeXYWH(referenceFrame.xywh);

      targetXYWH[1] = targetXYWH[1] + targetXYWH[3];
      targetXYWH[3] = DEFAULT_NOTE_HEIGHT;

      const newAddedNote = this.surface.page.addBlock(
        'affine:note',
        {
          xywh: serializeXYWH(...targetXYWH),
        },
        root.id
      );

      targetParent = newAddedNote;
    }

    this.surface.page.addBlock(
      'affine:surface-ref',
      {
        reference: this.frames[0].id,
        refFlavour: 'affine:frame',
      },
      targetParent
    );

    toast('Frame has been inserted into page');
  }

  override firstUpdated() {
    this._frameBackground = createButtonPopper(
      this._fillColorButton,
      this._fillColorMenu,
      ({ display }) => {
        this._popperShow = display === 'show';
      }
    );
    this._disposables.add(this._frameBackground);
  }

  protected override render() {
    const { frames } = this;

    const background = frames[0].background;
    return html`${frames.length === 1
        ? html`
            <edgeless-tool-icon-button
              .tooltip=${'Insert into Page'}
              .tipPosition=${'bottom'}
              @click=${this._insertIntoPage}
            >
              ${NoteIcon}
              <span style="margin-left: 2px;">Insert into Page</span>
            </edgeless-tool-icon-button>
            <component-toolbar-menu-divider></component-toolbar-menu-divider>
            <edgeless-tool-icon-button
              .tooltip=${'Rename'}
              .tipPosition=${'bottom'}
              .iconContainerPadding=${0}
              @click=${() =>
                mountFrameTitleEditor(this.frames[0], this.surface.edgeless)}
            >
              ${RenameIcon}
            </edgeless-tool-icon-button>
            <component-toolbar-menu-divider></component-toolbar-menu-divider>
          `
        : nothing}

      <edgeless-tool-icon-button
        class="fill-color-button"
        .tooltip=${this._popperShow ? '' : 'Background'}
        .tipPosition=${'bottom'}
        .active=${false}
        .iconContainerPadding=${2}
        @click=${() => this._frameBackground?.toggle()}
      >
        <div class="fill-color-container">${ColorUnit(background)}</div>
      </edgeless-tool-icon-button>
      <div class="color-panel-container fill-color">
        <edgeless-color-panel
          .value=${background}
          .options=${FRAME_BACKGROUND}
          @select=${(e: ColorEvent) => this._setFrameBackground(e.detail)}
        >
        </edgeless-color-panel>
      </div> `;
  }
}
