import { ArrowUpIcon, NoteIcon } from '@blocksuite/affine-components/icons';
import { css, html, LitElement } from 'lit';
import { state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { NoteTool } from '../../../tools/note-tool.js';
import type { EdgelessTool } from '../../../types.js';
import type { EdgelessNoteMenu } from './note-menu.js';

import { getTooltipWithShortcut } from '../../../components/utils.js';
import { createPopper, type MenuPopper } from '../common/create-popper.js';
import { QuickToolMixin } from '../mixins/quick-tool.mixin.js';

export class EdgelessNoteToolButton extends QuickToolMixin(LitElement) {
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

  private _noteMenu: MenuPopper<EdgelessNoteMenu> | null = null;

  private _states = ['childFlavour', 'childType', 'tip'] as const;

  override type: EdgelessTool['type'] = 'affine:note';

  private _disposeMenu() {
    this._noteMenu?.dispose();
    this._noteMenu = null;
  }

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
      this._noteMenu = createPopper('edgeless-note-menu', this);

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
    const arrowColor = active ? 'currentColor' : 'var(--affine-icon-secondary)';
    return html`
      <edgeless-tool-icon-button
        class="edgeless-note-button"
        .tooltip=${this._noteMenu ? '' : getTooltipWithShortcut('Note', 'N')}
        .tooltipOffset=${17}
        .active=${active}
        .iconContainerPadding=${6}
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

  @state()
  accessor childFlavour: NoteTool['childFlavour'] = 'affine:paragraph';

  @state()
  accessor childType = 'text';

  @state()
  accessor tip = 'Text';
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-note-tool-button': EdgelessNoteToolButton;
  }
}
