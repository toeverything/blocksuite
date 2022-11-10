import { html, css, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import {
  BoldIcon,
  CodeIcon,
  CopyIcon,
  ItalicIcon,
  LinkIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from './icons';
import './button';
import { toolTipStyle } from '../tooltip';
import { createLink } from '../../__internal__/rich-text/link-node';
import { getStartModelBySelection, sleep } from '../../__internal__/utils';
import { handleFormat } from '../../page-block/utils';

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
    action: () => {
      const { space } = getStartModelBySelection();
      handleFormat(space, 'bold');
    },
  },
  {
    name: 'Italic',
    icon: ItalicIcon,
    action: () => {
      const { space } = getStartModelBySelection();
      handleFormat(space, 'italic');
    },
  },
  {
    name: 'Underline',
    icon: UnderlineIcon,
    action: () => {
      const { space } = getStartModelBySelection();
      handleFormat(space, 'underline');
    },
  },
  {
    name: 'Strikethrough',
    icon: StrikethroughIcon,
    action: () => {
      const { space } = getStartModelBySelection();
      handleFormat(space, 'strike');
    },
  },
  {
    name: 'Code',
    icon: CodeIcon,
    action: () => {
      const { space } = getStartModelBySelection();
      handleFormat(space, 'code');
    },
  },
  {
    name: 'Link',
    icon: LinkIcon,
    action: () => {
      // TODO fix multiple selection
      const { space } = getStartModelBySelection();
      createLink(space);
    },
  },
];

const onCopy = () => {
  console.log('copy');
};

@customElement('format-quick-bar')
export class FormatQuickBar extends LitElement {
  static styles = formatQuickBarStyle;

  @property()
  left = '0px';

  @property()
  top = '0px';

  override render() {
    const paragraphItems = html``;

    const formatItems = html`
      ${formatButtons.map(
        ({ name, icon, action }) => html`<format-bar-button
          class="has-tool-tip"
          @click=${action}
        >
          ${icon}
          <tool-tip inert role="tooltip">${name}</tool-tip>
        </format-bar-button>`
      )}
    `;

    const actionItems = html`<format-bar-button
      class="has-tool-tip"
      @click=${onCopy}
    >
      ${CopyIcon}
      <tool-tip inert role="tooltip">Copy</tool-tip>
    </format-bar-button>`;

    // TODO add click away listener
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
