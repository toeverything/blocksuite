import type { Space } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { handleFormat } from '../../page-block/utils';
import { createLink } from '../../__internal__/rich-text/link-node';
import {
  getSelectInfo,
  getStartModelBySelection,
} from '../../__internal__/utils';
import { toolTipStyle } from '../tooltip';
import './button';
import {
  BoldIcon,
  CodeIcon,
  CopyIcon,
  ItalicIcon,
  LinkIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from './icons';

const saveSelection = () => {
  const sel = window.getSelection();
  if (!sel) {
    return;
  }
  if (sel.getRangeAt && sel.rangeCount) {
    return sel.getRangeAt(0);
  }
};

const restoreSelection = (range: Range) => {
  const sel = window.getSelection();
  if (!sel) {
    return;
  }
  sel.removeAllRanges();
  sel.addRange(range);
};

const formatQuickBarStyle = css`
  .format-quick-bar {
    z-index: var(--affine-z-index-popover);
    box-sizing: border-box;
    position: absolute;
    display: flex;
    align-items: center;
    padding: 4px 8px;
    gap: 4px;
    height: 40px;

    background: var(--affine-popover-background);
    box-shadow: 0px 1px 10px -6px rgba(24, 39, 75, 0.08),
      0px 3px 16px -6px rgba(24, 39, 75, 0.04);
    border-radius: 10px 10px 10px 0px;
  }

  .divider {
    width: 1px;
    height: 100%;
    background-color: #e0e6eb;
  }

  ${toolTipStyle}
`;

const formatButtons = [
  {
    name: 'Bold',
    icon: BoldIcon,
    action: (space: Space) => {
      handleFormat(space, 'bold');
    },
  },
  {
    name: 'Italic',
    icon: ItalicIcon,
    action: (space: Space) => {
      handleFormat(space, 'italic');
    },
  },
  {
    name: 'Underline',
    icon: UnderlineIcon,
    action: (space: Space) => {
      handleFormat(space, 'underline');
    },
  },
  {
    name: 'Strikethrough',
    icon: StrikethroughIcon,
    action: (space: Space) => {
      handleFormat(space, 'strike');
    },
  },
  {
    name: 'Code',
    icon: CodeIcon,
    action: (space: Space) => {
      handleFormat(space, 'code');
    },
  },
  {
    name: 'Link',
    icon: LinkIcon,
    action: (space: Space) => {
      createLink(space);
    },
  },
];

const onCopy = (space: Space) => {
  document.dispatchEvent(new ClipboardEvent('copy'));
};

@customElement('format-quick-bar')
export class FormatQuickBar extends LitElement {
  static styles = formatQuickBarStyle;

  @property()
  left = '0px';

  @property()
  top = '0px';

  // TODO fix multiple selection
  @property()
  space: Space | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    const model = getStartModelBySelection();
    this.space = model.space;
  }

  override render() {
    const space = this.space;

    if (!space) {
      console.error('Failed to render format-quick-bar! space not found!');
      return html``;
    }
    const paragraphItems = html``;

    const formatItems = html`
      ${formatButtons.map(
        ({ name, icon, action }) => html`<format-bar-button
          class="has-tool-tip"
          @click=${() => action(space)}
        >
          ${icon}
          <tool-tip inert role="tooltip">${name}</tool-tip>
        </format-bar-button>`
      )}
    `;

    const actionItems = html`<format-bar-button
      class="has-tool-tip"
      @click=${() => onCopy(space)}
    >
      ${CopyIcon}
      <tool-tip inert role="tooltip">Copy</tool-tip>
    </format-bar-button>`;

    return html`<div class="format-quick-bar-container">
      <div
        class="format-quick-bar"
        style="left: ${this.left}; top: ${this.top}"
      >
        ${paragraphItems}
        <div class="divider"></div>
        ${formatItems}
        <div class="divider"></div>
        ${actionItems}
      </div>
    </div>`;
  }
}

export const showFormatQuickBar = async ({
  anchorEl,
  container = document.body,
  abortController = new AbortController(),
}: {
  anchorEl: {
    getBoundingClientRect: () => DOMRect;
    // contextElement?: Element;
  };
  container?: HTMLElement;
  abortController?: AbortController;
}) => {
  const rect = anchorEl.getBoundingClientRect();
  const bodyRect = document.body.getBoundingClientRect();
  const offset = rect.top - bodyRect.top + rect.height;
  const offsetY = 5;

  const formatQuickBar = document.createElement('format-quick-bar');
  formatQuickBar.left = `${rect.left}px`;
  formatQuickBar.top = `${offset + offsetY}px`;
  container.appendChild(formatQuickBar);

  const clickAwayListener = (e: MouseEvent) => {
    if (e.target === formatQuickBar) {
      return;
    }
    abortController.abort();
    window.removeEventListener('mousedown', clickAwayListener);
  };
  window.addEventListener('mousedown', clickAwayListener);

  return new Promise<void>(res => {
    abortController.signal.addEventListener('abort', () => {
      // TODO add transition
      formatQuickBar.remove();
      res();
    });
  });
};

declare global {
  interface HTMLElementTagNameMap {
    'format-quick-bar': FormatQuickBar;
  }
}
