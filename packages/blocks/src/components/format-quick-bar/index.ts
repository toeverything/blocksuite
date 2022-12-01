import { BaseBlockModel, Signal, Page } from '@blocksuite/store';
import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { DragDirection, getFormat } from '../../page-block/utils';
import {
  convertToList,
  getContainerByModel,
  getCurrentRange,
  getModelsByRange,
  sleep,
} from '../../__internal__/utils';
import { toast } from '../toast';
import './button';
import { formatButtons, paragraphButtons } from './config';
import { ArrowDownIcon, CopyIcon } from './icons';
import { formatQuickBarStyle } from './styles';

const isListType = (type: string): type is 'bulleted' | 'numbered' | 'todo' =>
  ['bulleted', 'numbered', 'todo'].includes(type);

const onCopy = () => {
  document.dispatchEvent(new ClipboardEvent('copy'));
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
    this.page = startModel.page;
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
    const formatParagraph = (targetFormat: string) => {
      this.models
        .filter(i => i.type !== targetFormat)
        .forEach(async model => {
          if (!this.page) {
            throw new Error('Space is not defined');
          }
          if (isListType(targetFormat)) {
            convertToList(this.page, model, targetFormat, '');
          } else {
            this.page.updateBlock(model, { type: targetFormat });
            // format quick bar may need to update its position
            // after the paragraph type is changed
            await sleep();
            this.positionUpdated.emit();
          }
          this.paragraphType = targetFormat;
        });
    };
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
        ({ key, name, icon }) => html`<format-bar-button
          width="100%"
          style="padding-left: 12px; justify-content: flex-start;"
          text="${name}"
          @click=${() => formatParagraph(key)}
        >
          ${icon}
        </format-bar-button>`
      )}
    </div>`;
  }

  override render() {
    const space = this.page;

    if (!this.models.length || !space) {
      console.error('Failed to render format-quick-bar! space not found!');
      return html``;
    }
    const paragraphIcon =
      paragraphButtons.find(btn => btn.key === this.paragraphType)?.icon ??
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
          ({ name, icon, action, activeWhen }) => html`<format-bar-button
            class="has-tool-tip"
            ?active=${activeWhen(this.format)}
            @click=${() => {
              action(space, this.abortController);
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

export const showFormatQuickBar = async ({
  anchorEl,
  direction = 'right-bottom',
  container = document.body,
  abortController = new AbortController(),
}: {
  anchorEl: {
    getBoundingClientRect: () => DOMRect;
    // contextElement?: Element;
  };
  direction?: DragDirection;
  container?: HTMLElement;
  abortController?: AbortController;
}) => {
  // Init format quick bar

  const formatQuickBar = document.createElement('format-quick-bar');
  formatQuickBar.abortController = abortController;
  const positionUpdatedSignal = new Signal();
  formatQuickBar.positionUpdated = positionUpdatedSignal;

  // Handle Scroll

  const models = getModelsByRange(getCurrentRange());
  if (!models.length) {
    return;
  }
  const editorContainer = getContainerByModel(models[0]);
  // TODO need a better way to get the editor scroll container
  // Note: at edgeless mode, the scroll container is not exist!
  const scrollContainer = editorContainer.querySelector(
    '.affine-default-viewport'
  );

  const updatePos = () => {
    const rect = anchorEl.getBoundingClientRect();
    const bodyRect = document.body.getBoundingClientRect();
    const offsetY = 5;
    formatQuickBar.left = `${rect.left}px`;
    if (direction.includes('bottom')) {
      const offset = rect.top - bodyRect.top + rect.height;
      formatQuickBar.top = `${offset + offsetY}px`;
    } else if (direction.includes('top')) {
      const offset = bodyRect.bottom - rect.bottom + rect.height;
      formatQuickBar.bottom = `${offset + offsetY}px`;
    }
  };
  scrollContainer?.addEventListener('scroll', updatePos, { passive: true });
  positionUpdatedSignal.on(updatePos);
  updatePos();

  // Handle click outside

  const clickAwayListener = (e: MouseEvent) => {
    if (e.target === formatQuickBar) {
      return;
    }
    abortController.abort();
    window.removeEventListener('mousedown', clickAwayListener);
  };
  window.addEventListener('mousedown', clickAwayListener);

  // Mount
  container.appendChild(formatQuickBar);

  return new Promise<void>(res => {
    abortController.signal.addEventListener('abort', () => {
      // TODO add transition
      formatQuickBar.remove();
      scrollContainer?.removeEventListener('scroll', updatePos);
      res();
    });
  });
};

declare global {
  interface HTMLElementTagNameMap {
    'format-quick-bar': FormatQuickBar;
  }
}
