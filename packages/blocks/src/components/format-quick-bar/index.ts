import type { BaseBlockModel, Space } from '@blocksuite/store';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { handleFormat } from '../../page-block/utils';
import { createLink } from '../../__internal__/rich-text/link-node';
import {
  convertToList,
  getCurrentRange,
  getModelsByRange,
} from '../../__internal__/utils';
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
  TextIcon,
  TodoIcon,
  UnderlineIcon,
} from './icons';
import { formatQuickBarStyle } from './styles';

const paragraphButtons = [
  {
    key: 'text',
    name: 'Text',
    icon: TextIcon,
  },
  { key: 'h1', name: 'Heading 1', icon: H1Icon },
  { key: 'h2', name: 'Heading 2', icon: H2Icon },
  { key: 'h3', name: 'Heading 3', icon: H3Icon },
  { key: 'h4', name: 'Heading 4', icon: H4Icon },
  { key: 'h5', name: 'Heading 5', icon: H5Icon },
  { key: 'h6', name: 'Heading 6', icon: H6Icon },
  { key: 'bulleted', name: 'Bulleted List', icon: BulletedListIcon },
  { key: 'numbered', name: 'Numbered List', icon: NumberedIcon },
  { key: 'todo', name: 'To-do List', icon: TodoIcon },
  { key: 'code', name: 'Code Block', icon: CodeIcon },
  { key: 'quote', name: 'Quote', icon: QuoteIcon },
  { key: 'callout', name: 'Callout', icon: CalloutIcon },
];

const isListType = (type: string): type is 'bulleted' | 'numbered' | 'todo' =>
  ['bulleted', 'numbered', 'todo'].includes(type);

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

  @property()
  paragraphType = 'text';

  override connectedCallback(): void {
    super.connectedCallback();
    // TODO handle multiple selection
    const models = getModelsByRange(getCurrentRange());
    this.models = models;
    if (!models.length) {
      return;
    }
    const startModel = models[0];
    this.paragraphType = startModel.type;
    this.space = startModel.space;
    if (models.length > 1) {
      // Select multiple models
    }

    console.log(models);
  }

  private paragraphPanelTemplate() {
    return html`<div
      class="paragraph-panel"
      style="left: 0; top: calc(100% + 4px)"
    >
      ${paragraphButtons.map(
        ({ key, name, icon }) => html`<format-bar-button
          width="100%"
          style="padding-left: 12px; justify-content: flex-start;"
          text="${name}"
          @click=${() => {
            this.models
              .filter(i => i.type !== key)
              .forEach(model => {
                if (!this.space) {
                  throw new Error('Space is not defined');
                }
                if (isListType(key)) {
                  convertToList(this.space, model, key, '');
                } else {
                  this.space.updateBlock(model, { type: key });
                }
              });
          }}
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
