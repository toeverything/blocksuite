import '../../edgeless/components/buttons/tool-icon-button.js';
import '../element-toolbar/component-toolbar-menu-divider.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import { toast } from '../../../_common/components/toast.js';
import { NoteIcon, RenameIcon } from '../../../_common/icons/index.js';
import type { CssVariableName } from '../../../_common/theme/css-variables.js';
import { NoteDisplayMode } from '../../../_common/types.js';
import { createButtonPopper } from '../../../_common/utils/button-popper.js';
import { matchFlavours } from '../../../_common/utils/model.js';
import type { FrameBlockModel } from '../../../frame-block/index.js';
import {
  deserializeXYWH,
  serializeXYWH,
} from '../../../surface-block/index.js';
import type { EdgelessToolIconButton } from '../../edgeless/components/buttons/tool-icon-button.js';
import type { ColorEvent } from '../../edgeless/components/panel/color-panel.js';
import { ColorUnit } from '../../edgeless/components/panel/color-panel.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import { DEFAULT_NOTE_HEIGHT } from '../../edgeless/utils/consts.js';
import { mountFrameTitleEditor } from '../../edgeless/utils/text.js';

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
  edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  frames: FrameBlockModel[] = [];

  @state()
  private _showPopper = false;

  @query('.fill-color-button')
  private _fillColorButton!: EdgelessToolIconButton;
  @query('.color-panel-container.fill-color')
  private _fillColorMenu!: HTMLDivElement;
  private _frameBackground: ReturnType<typeof createButtonPopper> | null = null;

  get service() {
    return this.edgeless.service;
  }

  private _setFrameBackground(color: CssVariableName) {
    this.frames.forEach(frame => {
      this.service.updateElement(frame.id, { background: color });
    });
  }

  private _insertIntoPage() {
    if (!this.edgeless.doc.root) return;

    const rootModel = this.edgeless.doc.root;
    const notes = rootModel.children.filter(
      model =>
        matchFlavours(model, ['affine:note']) &&
        model.displayMode !== NoteDisplayMode.EdgelessOnly
    );
    const lastNote = notes[notes.length - 1];
    const referenceFrame = this.frames[0];

    let targetParent = lastNote?.id;

    if (!lastNote) {
      const targetXYWH = deserializeXYWH(referenceFrame.xywh);

      targetXYWH[1] = targetXYWH[1] + targetXYWH[3];
      targetXYWH[3] = DEFAULT_NOTE_HEIGHT;

      const newAddedNote = this.edgeless.doc.addBlock(
        'affine:note',
        {
          xywh: serializeXYWH(...targetXYWH),
        },
        rootModel.id
      );

      targetParent = newAddedNote;
    }

    this.edgeless.doc.addBlock(
      'affine:surface-ref',
      {
        reference: this.frames[0].id,
        refFlavour: 'affine:frame',
      },
      targetParent
    );

    toast(this.edgeless.host, 'Frame has been inserted into doc');
  }

  override firstUpdated() {
    this._frameBackground = createButtonPopper(
      this._fillColorButton,
      this._fillColorMenu,
      ({ display }) => {
        this._showPopper = display === 'show';
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
              .tooltip=${'Insert into doc'}
              @click=${this._insertIntoPage}
            >
              ${NoteIcon}

              <span style="margin-left: 2px;">Insert into Page</span>
            </edgeless-tool-icon-button>

            <component-toolbar-menu-divider></component-toolbar-menu-divider>

            <edgeless-tool-icon-button
              .tooltip=${'Rename'}
              .iconContainerPadding=${0}
              @click=${() =>
                mountFrameTitleEditor(this.frames[0], this.edgeless)}
            >
              ${RenameIcon}
            </edgeless-tool-icon-button>

            <component-toolbar-menu-divider></component-toolbar-menu-divider>
          `
        : nothing}

      <edgeless-tool-icon-button
        class="fill-color-button"
        .tooltip=${this._showPopper ? nothing : 'Background'}
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

export function renderFrameButton(
  edgeless: EdgelessRootBlockComponent,
  frames?: FrameBlockModel[]
) {
  if (!frames?.length) return nothing;

  return html`<edgeless-change-frame-button
    .edgeless=${edgeless}
    .frames=${frames}
  ></edgeless-change-frame-button>`;
}
