import '../../buttons/tool-icon-button.js';
import './note-menu.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { ArrowUpIcon, NoteIcon } from '../../../../../_common/icons/index.js';
import type { NoteTool } from '../../../../../_common/utils/index.js';
import { getTooltipWithShortcut } from '../../../components/utils.js';
import type { EdgelessRootBlockComponent } from '../../../edgeless-root-block.js';
import { createPopper, type MenuPopper } from '../common/create-popper.js';
import type { EdgelessNoteMenu } from './note-menu.js';

@customElement('edgeless-note-tool-button')
export class EdgelessNoteToolButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
    }

    .arrow-up-icon {
      position: absolute;
      top: 4px;
      right: 2px;
      font-size: 0;
    }
  `;

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  active = false;

  @state()
  childFlavour: NoteTool['childFlavour'] = 'affine:paragraph';

  @state()
  childType = 'text';

  @state()
  tip = 'Text';

  private _noteMenu: MenuPopper<EdgelessNoteMenu> | null = null;
  private _states = ['childFlavour', 'childType', 'tip'] as const;

  private _toggleNoteMenu() {
    if (this._noteMenu) {
      this._disposeMenu();
      this.requestUpdate();
    } else {
      this.edgeless.tools.setEdgelessTool({
        type: 'affine:note',
        childFlavour: this.childFlavour,
        childType: this.childType,
        tip: this.tip,
      });
      this._noteMenu = createPopper('edgeless-note-menu', this, {
        x: 110,
        y: -40,
      });

      this._noteMenu.element.edgeless = this.edgeless;
      this._noteMenu.element.childFlavour = this.childFlavour;
      this._noteMenu.element.childType = this.childType;
      this._noteMenu.element.tip = this.tip;
      this._noteMenu.element.onChange = (
        props: Partial<{
          childFlavour: NoteTool['childFlavour'];
          childType: string | null;
          tip: string;
        }>
      ) => {
        this._states.forEach(key => {
          if (props[key] != undefined) {
            Object.assign(this, { [key]: props[key] });
          }
        });
        this.edgeless.tools.setEdgelessTool({
          type: 'affine:note',
          childFlavour: this.childFlavour,
          childType: this.childType,
          tip: this.tip,
        });
      };
    }
  }

  private _disposeMenu() {
    this._noteMenu?.dispose();
    this._noteMenu = null;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(newTool => {
        if (newTool.type !== 'affine:note') {
          this._disposeMenu();
        }
      })
    );
  }

  override disconnectedCallback() {
    this._disposeMenu();
    super.disconnectedCallback();
  }

  override render() {
    const { active } = this;
    const arrowColor = active ? 'currentColor' : '#77757D';
    return html`
      <edgeless-tool-icon-button
        class="edgeless-note-button"
        .tooltip=${this._noteMenu ? '' : getTooltipWithShortcut('Note', 'N')}
        .tooltipOffset=${17}
        .active=${active}
        .iconContainerPadding=${8}
        @click=${() => {
          this._toggleNoteMenu();
        }}
      >
        ${NoteIcon}
        <span class="arrow-up-icon" style=${styleMap({ color: arrowColor })}>
          ${ArrowUpIcon}
        </span>
      </edgeless-tool-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-note-tool-button': EdgelessNoteToolButton;
  }
}
