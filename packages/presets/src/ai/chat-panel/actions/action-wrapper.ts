import type { EditorHost } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import {
  ActionIcon,
  AIChangeToneIcon,
  AIDoneIcon,
  AIExpandMindMapIcon,
  AIExplainIcon,
  AIExplainSelectionIcon,
  AIFindActionsIcon,
  AIImageIcon,
  AIImproveWritingIcon,
  AIMakeLongerIcon,
  AIMakeRealIcon,
  AIMakeShorterIcon,
  AIMindMapIcon,
  AIPenIcon,
  AIPresentationIcon,
  ArrowDownIcon,
  ArrowUpIcon,
} from '../../_common/icons.js';
import { createTextRenderer } from '../../messages/text.js';
import type { ChatAction } from '../chat-context.js';
import { renderImages } from '../components/images.js';
import { HISTORY_IMAGE_ACTIONS } from '../const.js';

const icons: Record<string, TemplateResult<1>> = {
  'Fix spelling for it': AIDoneIcon,
  'Improve grammar for it': AIDoneIcon,
  'Explain this code': AIExplainIcon,
  'Check code error': AIExplainIcon,
  'Explain this': AIExplainSelectionIcon,
  Translate: ActionIcon,
  'Change tone': AIChangeToneIcon,
  'Improve writing for it': AIImproveWritingIcon,
  'Make it longer': AIMakeLongerIcon,
  'Make it shorter': AIMakeShorterIcon,
  'Continue writing': AIPenIcon,
  'Make it real': AIMakeRealIcon,
  'Find action items from it': AIFindActionsIcon,
  Summary: AIPenIcon,
  'Create headings': AIPenIcon,
  'Write outline': AIPenIcon,
  image: AIImageIcon,
  'Brainstorm mindmap': AIMindMapIcon,
  'Expand mind map': AIExpandMindMapIcon,
  'Create a presentation': AIPresentationIcon,
  'Write a poem about this': AIPenIcon,
  'Write a blog post about this': AIPenIcon,
  'AI image filter clay style': AIImageIcon,
  'AI image filter sketch style': AIImageIcon,
  'AI image filter anime style': AIImageIcon,
  'AI image filter pixel style': AIImageIcon,
  Clearer: AIImageIcon,
  'Remove background': AIImageIcon,
  'Convert to sticker': AIImageIcon,
};

@customElement('action-wrapper')
export class ActionWrapper extends WithDisposable(LitElement) {
  static override styles = css`
    .action-name {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 22px;
      margin-bottom: 12px;

      svg {
        color: var(--affine-primary-color);
      }

      div:last-child {
        cursor: pointer;
        display: flex;
        align-items: center;
        flex: 1;

        div:last-child svg {
          margin-left: auto;
        }
      }
    }

    .answer-prompt {
      padding: 8px;
      background-color: var(--affine-background-secondary-color);
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 14px;
      font-weight: 400;
      color: var(--affine-text-primary-color);

      .subtitle {
        font-size: 12px;
        font-weight: 500;
        color: var(--affine-text-secondary-color);
        height: 20px;
        line-height: 20px;
      }

      .prompt {
        margin-top: 12px;
      }
    }
  `;

  @state()
  accessor promptShow = false;

  @property({ attribute: false })
  accessor item!: ChatAction;

  @property({ attribute: false })
  accessor host!: EditorHost;

  protected override render() {
    const { item } = this;

    const originalText = item.messages[1].content;
    const answer = item.messages[2]?.content;
    const images = item.messages[1].attachments;

    return html`<style></style>
      <slot></slot>
      <div
        class="action-name"
        @click=${() => (this.promptShow = !this.promptShow)}
      >
        ${icons[item.action] ? icons[item.action] : ActionIcon}
        <div>
          <div>${item.action}</div>
          <div>${this.promptShow ? ArrowDownIcon : ArrowUpIcon}</div>
        </div>
      </div>
      ${this.promptShow
        ? html`
            <div class="answer-prompt">
              <div class="subtitle">Answer</div>
              ${HISTORY_IMAGE_ACTIONS.includes(item.action)
                ? images && renderImages(images)
                : nothing}
              ${answer
                ? createTextRenderer(this.host, { customHeading: true })(answer)
                : nothing}
              ${originalText
                ? html`<div class="subtitle prompt">Prompt</div>
                    ${createTextRenderer(this.host, { customHeading: true })(
                      item.messages[0].content + originalText
                    )}`
                : nothing}
            </div>
          `
        : nothing} `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'action-wrapper': ActionWrapper;
  }
}
