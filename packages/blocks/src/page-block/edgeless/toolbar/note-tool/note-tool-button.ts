import '../../components/tool-icon-button.js';
import './note-menu.js';

import { ArrowUpIcon, NoteIcon } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/store';
import { computePosition, offset } from '@floating-ui/dom';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { MouseMode } from '../../../../__internal__/index.js';
import type { CssVariableName } from '../../../../__internal__/theme/css-variables.js';
import { getTooltipWithShortcut } from '../../components/utils.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
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

interface NoteMenuPopper {
  element: EdgelessNoteMenu;
  dispose: () => void;
}

function createNoteMenuPopper(reference: HTMLElement): NoteMenuPopper {
  const noteMenu = document.createElement('edgeless-note-menu');
  assertExists(reference.shadowRoot);
  reference.shadowRoot.appendChild(noteMenu);

  computePosition(reference, noteMenu, {
    placement: 'top-start',
    middleware: [
      offset({
        mainAxis: -20,
      }),
    ],
  }).then(({ x, y }) => {
    Object.assign(noteMenu.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  });

  return {
    element: noteMenu,
    dispose: () => {
      noteMenu.remove();
    },
  };
}

@customElement('edgeless-note-tool-button')
export class EdgelessNoteToolButton extends LitElement {
  static override styles = css`
    :host {
      display: flex;
    }

    edgeless-tool-icon-button svg + svg {
      margin-left: 8px;
    }
  `;

  @property({ attribute: false })
  mouseMode!: MouseMode;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  setMouseMode!: (mouseMode: MouseMode) => void;

  @state()
  private _popperShow = false;

  private _noteMenu: NoteMenuPopper | null = null;

  private _toggleNoteMenu() {
    if (this._noteMenu) {
      this._noteMenu.dispose();
      this._noteMenu = null;
      this._popperShow = false;
    } else {
      this._noteMenu = createNoteMenuPopper(this);
      this._noteMenu.element.mouseMode = this.mouseMode;
      this._noteMenu.element.edgeless = this.edgeless;
      this._popperShow = true;
    }
  }

  private iconButtonStyles = `
    --hover-color: var(--affine-hover-color);
    --active-color: var(--affine-primary-color);
  `;

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mouseMode')) {
      if (this.mouseMode.type !== 'note') {
        this._noteMenu?.dispose();
        this._noteMenu = null;
        this._popperShow = false;
      }
      if (this._noteMenu) {
        this._noteMenu.element.mouseMode = this.mouseMode;
        this._noteMenu.element.edgeless = this.edgeless;
      }
    }
  }

  override disconnectedCallback() {
    this._noteMenu?.dispose();
    this._noteMenu = null;
    this._popperShow = false;
    super.disconnectedCallback();
  }

  override render() {
    const type = this.mouseMode?.type;

    return html`
      <edgeless-tool-icon-button
        style=${this.iconButtonStyles}
        .tooltip=${this._popperShow ? '' : getTooltipWithShortcut('Note', 'N')}
        .active=${type === 'note'}
        @click=${() => {
          this.setMouseMode({
            type: 'note',
            background: DEFAULT_NOTE_COLOR,
          });
          this._toggleNoteMenu();
        }}
      >
        ${NoteIcon} ${ArrowUpIcon}
      </edgeless-tool-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-note-tool-button': EdgelessNoteToolButton;
  }
}
