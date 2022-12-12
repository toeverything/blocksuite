import { BaseBlockModel, Page, Signal } from '@blocksuite/store';
import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { getFormat, updateTextType } from '../../page-block/utils';
import {
  getCurrentRange,
  getModelsByRange,
  restoreSelection,
} from '../../__internal__/utils';
import { toast } from '../toast';
import './button';
import { formatButtons, paragraphButtons } from './config';
import { ArrowDownIcon, CopyIcon } from './icons';
import { formatQuickBarStyle } from './styles';

const onCopy = () => {
  const curRange = getCurrentRange();
  document.dispatchEvent(new ClipboardEvent('copy'));

  // Workaround for copyToClipboardFromPc's bad implementation
  // copyToClipboardFromPc will createElement('textarea') and select all text,
  // so will cause the selection to be lost.
  // See more details in copy-cut-manager.ts
  // The next line can be removed after the issue is solved
  restoreSelection(curRange);
  toast('Copied to clipboard');
};

@customElement('format-quick-bar')
export class FormatQuickBar extends LitElement {
  static styles = formatQuickBarStyle;

  @property()
  left: string | null = null;

  @property()
  top: string | null = null;

  @property()
  bottom: string | null = null;

  @property()
  abortController = new AbortController();

  // Sometimes the quick bar need to update position
  @property()
  positionUpdated = new Signal();

  @state()
  models: BaseBlockModel[] = [];

  @state()
  page: Page | null = null;

  @state()
  paragraphType = 'text';

  @property()
  paragraphPanelHoverDelay = 150;

  @state()
  paragraphPanelTimer = 0;

  @state()
  showParagraphPanel: 'top' | 'bottom' | 'hidden' = 'hidden';

  @state()
  format: Record<string, unknown> = {};

  @query('.format-quick-bar')
  formatQuickBarElement!: HTMLElement;

  override connectedCallback(): void {
    super.connectedCallback();
    // TODO handle multiple selection
    const models = getModelsByRange(getCurrentRange());
    this.models = models;
    if (!models.length) {
      return;
    }
    this.format = getFormat();
    const startModel = models[0];
    this.paragraphType = startModel.type;
    this.page = startModel.page as Page;
    if (models.length > 1) {
      // Select multiple models
    }
  }

  private onHover() {
    if (this.showParagraphPanel !== 'hidden') {
      clearTimeout(this.paragraphPanelTimer);
      return;
    }
    this.paragraphPanelTimer = window.setTimeout(async () => {
      const rect = this.formatQuickBarElement.getBoundingClientRect();
      const bodyRect = document.body.getBoundingClientRect();
      const topSpace = rect.top - bodyRect.top;
      const bottomSpace = bodyRect.bottom - rect.bottom;
      this.showParagraphPanel = topSpace > bottomSpace ? 'top' : 'bottom';
    }, this.paragraphPanelHoverDelay);
  }

  private onHoverEnd() {
    if (this.showParagraphPanel !== 'hidden') {
      // Prepare to disappear
      this.paragraphPanelTimer = window.setTimeout(async () => {
        this.showParagraphPanel = 'hidden';
      }, this.paragraphPanelHoverDelay);
      return;
    }
    clearTimeout(this.paragraphPanelTimer);
  }

  private paragraphPanelTemplate() {
    if (this.showParagraphPanel === 'hidden') {
      return html``;
    }
    const styles = styleMap({
      left: '0',
      top: this.showParagraphPanel === 'bottom' ? 'calc(100% + 4px)' : null,
      bottom: this.showParagraphPanel === 'top' ? 'calc(100% + 4px)' : null,
      display: 'flex',
      flexDirection:
        this.showParagraphPanel === 'bottom' ? 'column' : 'column-reverse',
    });
    return html`<div
      class="paragraph-panel"
      style="${styles}"
      @mouseover=${this.onHover}
      @mouseout=${this.onHoverEnd}
    >
      ${paragraphButtons.map(
        ({ flavour, type, name, icon }) => html`<format-bar-button
          width="100%"
          style="padding-left: 12px; justify-content: flex-start;"
          text="${name}"
          data-testid="${type}"
          @click=${() => {
            if (!this.page) {
              throw new Error('Failed to format paragraph! Page not found.');
            }
            if (this.paragraphType === type) {
              // Already in the target format, convert back to text
              const { flavour: defaultParagraph, type: defaultType } =
                paragraphButtons[0];
              updateTextType(defaultParagraph, defaultType, this.page);
              this.paragraphType = defaultType;
              return;
            }
            updateTextType(flavour, type, this.page);
            this.paragraphType = type;
          }}
        >
          ${icon}
        </format-bar-button>`
      )}
    </div>`;
  }

  override render() {
    const page = this.page;

    if (!this.models.length || !page) {
      console.error(
        'Failed to render format-quick-bar! page not found!',
        this.models,
        page
      );
      return html``;
    }
    const paragraphIcon =
      paragraphButtons.find(btn => btn.type === this.paragraphType)?.icon ??
      paragraphButtons[0].icon;
    const paragraphItems = html`<format-bar-button
      class="paragraph-button"
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
          ({ id, name, icon, action, activeWhen }) => html`<format-bar-button
            class="has-tool-tip"
            data-testid=${id}
            ?active=${activeWhen(this.format)}
            @click=${() => {
              action({
                page,
                abortController: this.abortController,
                format: this.format,
              });
              // format state need to update after format
              this.format = getFormat();
            }}
          >
            ${icon}
            <tool-tip inert role="tooltip">${name}</tool-tip>
          </format-bar-button>`
        )}
    `;

    const actionItems = html`<format-bar-button
      class="has-tool-tip"
      data-testid="copy"
      @click=${() => onCopy()}
    >
      ${CopyIcon}
      <tool-tip inert role="tooltip">Copy</tool-tip>
    </format-bar-button>`;

    const styles = styleMap({
      left: this.left,
      top: this.top,
      bottom: this.bottom,
    });
    return html`<div class="format-quick-bar" style="${styles}">
      ${paragraphItems}
      <div class="divider"></div>
      ${formatItems}
      <div class="divider"></div>
      ${actionItems} ${paragraphPanel}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'format-quick-bar': FormatQuickBar;
  }
}
