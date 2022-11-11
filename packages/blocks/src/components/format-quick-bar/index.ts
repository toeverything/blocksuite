import type { BaseBlockModel, Space } from '@blocksuite/store';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { handleFormat } from '../../page-block/utils';
import { createLink } from '../../__internal__/rich-text/link-node';
import { getCurrentRange, getModelsByRange } from '../../__internal__/utils';
import { toast } from '../toast';
import './button';
import {
  BoldIcon,
  BulletedListIcon,
  CalloutIcon,
  CodeIcon,
  CopyIcon,
  H1Icon,
  H2Icon,
  H3Icon,
  H4Icon,
  H5Icon,
  H6Icon,
  InlineCodeIcon,
  ItalicIcon,
  LinkIcon,
  NumberedIcon,
  QuoteIcon,
  StrikethroughIcon,
  TodoIcon,
  UnderlineIcon,
} from './icons';
import { formatQuickBarStyle } from './styles';

const saveSelection = () => {
  const sel = window.getSelection();
  if (!sel) {
    return;
  }
  if (sel.getRangeAt && sel.rangeCount) {
    return sel.getRangeAt(0);
  }
  return;
};

const restoreSelection = (range: Range) => {
  const sel = window.getSelection();
  if (!sel) {
    return;
  }
  sel.removeAllRanges();
  sel.addRange(range);
};

const paragraphButtons = [
  { key: 'H1', name: 'Heading 1', icon: H1Icon },
  { key: 'H2', name: 'Heading 2', icon: H2Icon },
  { key: 'H3', name: 'Heading 3', icon: H3Icon },
  { key: 'H4', name: 'Heading 4', icon: H4Icon },
  { key: 'H5', name: 'Heading 5', icon: H5Icon },
  { key: 'H6', name: 'Heading 6', icon: H6Icon },
  { key: 'BulletedList', name: 'Bulleted List', icon: BulletedListIcon },
  { key: 'Numbered', name: 'Numbered List', icon: NumberedIcon },
  { key: 'Todo', name: 'To-do List', icon: TodoIcon },
  { key: 'Code', name: 'Code Block', icon: CodeIcon },
  { key: 'Quote', name: 'Quote', icon: QuoteIcon },
  { key: 'Callout', name: 'Callout', icon: CalloutIcon },
];

const formatButtons = [
  {
    name: 'Bold',
    icon: BoldIcon,
    activeWhen: (models: BaseBlockModel[]) => false,
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
    icon: InlineCodeIcon,
    action: (space: Space) => {
      handleFormat(space, 'code');
    },
  },
  {
    name: 'Link',
    icon: LinkIcon,
    // Only can show link button when selection is in one line paragraph
    showWhen: (models: BaseBlockModel[]) => models.length === 1,
    action: (space: Space) => {
      createLink(space);
    },
  },
];

const onCopy = (space: Space) => {
  document.dispatchEvent(new ClipboardEvent('copy'));
  toast('Copied to clipboard');
};

@customElement('format-quick-bar')
export class FormatQuickBar extends LitElement {
  static styles = formatQuickBarStyle;

  @property()
  left = '0px';

  @property()
  top = '0px';

  @property()
  models: BaseBlockModel[] = [];

  @property()
  space: Space | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    // TODO handle multiple selection
    const models = getModelsByRange(getCurrentRange());
    this.models = models;
    if (!models.length) {
      return;
    }
    const startModel = models[0];
    this.space = startModel.space;
    if (models.length > 1) {
      // Select multiple models
    }
  }

  private paragraphPanelTemplate() {
    const PARAGRAPH_PANEL_OFFSET = /* format bar height */ 40 + /* margin */ 4;
    return html`<div
      class="paragraph-panel"
      style="left: 0; top: calc(100% + 4px)"
    >
      ${paragraphButtons.map(
        ({ name, icon }) => html`<format-bar-button
          width="100%"
          style="padding-left: 12px; justify-content: flex-start;"
          text="${name}"
        >
          ${icon}
        </format-bar-button>`
      )}
    </div>`;
  }

  override render() {
    const space = this.space;

    if (!this.models.length || !space) {
      console.error('Failed to render format-quick-bar! space not found!');
      return html``;
    }
    const paragraphItems = html``;
    const paragraphPanel = this.paragraphPanelTemplate();

    const formatItems = html`
      ${formatButtons
        .filter(({ showWhen = () => true }) => showWhen(this.models))
        .map(
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
        ${actionItems} ${paragraphPanel}
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

  // TODO add MutationObserver/ResizeObserver to update position
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
