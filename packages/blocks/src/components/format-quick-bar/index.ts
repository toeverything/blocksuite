import type { BaseBlockModel, Space } from '@blocksuite/store';
import { html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  convertToList,
  getCurrentRange,
  getModelsByRange,
} from '../../__internal__/utils';
import { toast } from '../toast';
import './button';
import { formatButtons, paragraphButtons } from './config';
import { ArrowDownIcon, CopyIcon, TextIcon } from './icons';
import { formatQuickBarStyle } from './styles';

const isListType = (type: string): type is 'bulleted' | 'numbered' | 'todo' =>
  ['bulleted', 'numbered', 'todo'].includes(type);

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
  abortController = new AbortController();

  @state()
  models: BaseBlockModel[] = [];

  @state()
  space: Space | null = null;

  @state()
  paragraphType = 'text';

  @property()
  paragraphPanelHoverDelay = 150;

  @state()
  paragraphPanelTimer = 0;

  @state()
  showParagraphPanel = false;

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

  private onHover(e: MouseEvent) {
    if (this.showParagraphPanel) {
      clearTimeout(this.paragraphPanelTimer);
      return;
    }
    this.paragraphPanelTimer = window.setTimeout(async () => {
      this.showParagraphPanel = true;
    }, this.paragraphPanelHoverDelay);
  }

  private onHoverEnd(e: Event) {
    if (this.showParagraphPanel) {
      // Prepare to disappear
      this.paragraphPanelTimer = window.setTimeout(async () => {
        this.showParagraphPanel = false;
      }, this.paragraphPanelHoverDelay);
      return;
    }
    clearTimeout(this.paragraphPanelTimer);
  }

  private paragraphPanelTemplate() {
    if (!this.showParagraphPanel) {
      return html``;
    }
    return html`<div
      class="paragraph-panel"
      style="left: 0; top: calc(100% + 4px)"
      @mouseover=${this.onHover}
      @mouseout=${this.onHoverEnd}
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
                this.paragraphType = key;
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
    const paragraphIcon =
      paragraphButtons.find(btn => btn.key === this.paragraphType)?.icon ??
      paragraphButtons[0].icon;
    const paragraphItems = html`<format-bar-button
      width="52px"
      @mouseover=${this.onHover}
      @mouseout=${this.onHoverEnd}
    >
      ${paragraphIcon} ${ArrowDownIcon}
    </format-bar-button>`;

    const paragraphPanel = this.paragraphPanelTemplate();

    const formatItems = html`
      ${formatButtons
        .filter(({ showWhen = () => true }) => showWhen(this.models))
        .map(
          ({ name, icon, action }) => html`<format-bar-button
            class="has-tool-tip"
            @click=${() => action(space, this.abortController)}
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
  formatQuickBar.abortController = abortController;
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
