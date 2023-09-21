import '../../buttons/tool-icon-button.js';
import './note-menu.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessTool } from '../../../../../__internal__/index.js';
import type { CssVariableName } from '../../../../../__internal__/theme/css-variables.js';
import { ArrowUpIcon, NoteIcon } from '../../../../../icons/index.js';
import { getTooltipWithShortcut } from '../../../components/utils.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import { createPopper, type MenuPopper } from '../common/create-popper.js';
import type { EdgelessNoteMenu } from './note-menu.js';

export const NOTE_COLORS: CssVariableName[] = [
  '--affine-background-secondary-color',
  '--affine-tag-yellow',
  '--affine-tag-red',
  '--affine-tag-green',
  '--affine-tag-blue',
  '--affine-tag-purple',
];

export const DEFAULT_NOTE_COLOR = NOTE_COLORS[0];

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
  edgelessTool!: EdgelessTool;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  setEdgelessTool!: (edgelessTool: EdgelessTool) => void;

  private _noteMenu: MenuPopper<EdgelessNoteMenu> | null = null;

  private _toggleNoteMenu() {
    if (this._noteMenu) {
      this._noteMenu.dispose();
      this._noteMenu = null;
    } else {
      this._noteMenu = createPopper('edgeless-note-menu', this, {
        x: 110,
        y: -40,
      });
      this._noteMenu.element.edgelessTool = this.edgelessTool;
      this._noteMenu.element.edgeless = this.edgeless;
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('edgelessTool')) {
      if (this.edgelessTool.type !== 'note') {
        this._noteMenu?.dispose();
        this._noteMenu = null;
      }
      if (this._noteMenu) {
        this._noteMenu.element.edgelessTool = this.edgelessTool;
        this._noteMenu.element.edgeless = this.edgeless;
      }
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(newTool => {
        if (newTool.type !== 'note') {
          this._noteMenu?.dispose();
          this._noteMenu = null;
        }
      })
    );
  }

  override disconnectedCallback() {
    this._noteMenu?.dispose();
    this._noteMenu = null;
    super.disconnectedCallback();
  }

  override render() {
    const type = this.edgelessTool?.type;
    const arrowColor = type === 'note' ? 'currentColor' : '#77757D';
    return html`
      <edgeless-tool-icon-button
        .tooltip=${this._noteMenu ? '' : getTooltipWithShortcut('Note', 'N')}
        .active=${type === 'note'}
        .iconContainerPadding=${8}
        @click=${() => {
          this.setEdgelessTool({
            type: 'note',
            background: DEFAULT_NOTE_COLOR,
            childFlavour: 'affine:paragraph',
            childType: 'text',
            tip: 'Text',
          });
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
